/**
 * ZERO-TOUCH CLAIMS PROCESSOR
 * Pipeline: Trigger → Verify → Fraud Check → Payout → Resolution
 */

import { analyzeClaimText, analyzeBehavioralDrift } from './fraudDetectionEngine.js';

const CLAIM_STATUSES = ['auto-approved', 'pending-verification', 'under-review', 'flagged', 'rejected', 'paid'];

export function processClaimZeroTouch(claim, rider, triggerResult) {
  const steps = [];
  let currentStatus = 'initiated';
  let finalPayout = 0;

  // Step 1: Trigger Verification
  const triggerVerified = triggerResult && triggerResult.fired && triggerResult.confidence > 60;
  steps.push({ step: 1, name: 'Trigger Verification', status: triggerVerified ? 'passed' : 'failed', detail: triggerVerified ? `Trigger ${triggerResult.name} confirmed (${triggerResult.confidence}% confidence)` : 'No matching trigger found', timestamp: Date.now(), durationMs: 120 });
  if (!triggerVerified) { return { status: 'rejected', reason: 'No verified trigger', steps, payout: 0, processingTimeMs: 120 }; }

  // Step 2: NLP Text Analysis
  const nlp = analyzeClaimText(claim.riderDescription);
  const nlpPassed = nlp.overallScore < 55;
  steps.push({ step: 2, name: 'NLP Text Analysis', status: nlpPassed ? 'passed' : nlp.overallScore < 70 ? 'warning' : 'failed', detail: `Fraud score: ${nlp.overallScore}/100 — ${nlp.verdict}`, nlpResult: nlp, timestamp: Date.now() + 200, durationMs: 200 });

  // Step 3: Behavioral Drift Check
  const drift = analyzeBehavioralDrift(rider);
  const driftPassed = drift.overallDrift < 50;
  steps.push({ step: 3, name: 'Behavioral Analysis', status: driftPassed ? 'passed' : drift.overallDrift < 70 ? 'warning' : 'failed', detail: `Drift score: ${drift.overallDrift}/100 — ${drift.riskLevel}`, driftResult: drift, timestamp: Date.now() + 350, durationMs: 150 });

  // Step 4: Trust Gate
  const trustPassed = rider.trustScore >= 65;
  steps.push({ step: 4, name: 'Trust Gate', status: trustPassed ? 'passed' : rider.trustScore >= 45 ? 'warning' : 'failed', detail: `Trust score: ${rider.trustScore}/100`, timestamp: Date.now() + 400, durationMs: 50 });

  // Decision Logic
  const passCount = [triggerVerified, nlpPassed, driftPassed, trustPassed].filter(Boolean).length;
  const warningCount = steps.filter(s => s.status === 'warning').length;

  if (passCount === 4) {
    currentStatus = 'auto-approved';
    finalPayout = triggerResult.payoutEstimate;
    steps.push({ step: 5, name: 'Auto-Approval', status: 'passed', detail: `Zero-touch approval. Payout: ₹${finalPayout}`, timestamp: Date.now() + 500, durationMs: 100 });
  } else if (passCount >= 3 && warningCount <= 1 && rider.trustScore >= 75) {
    currentStatus = 'auto-approved';
    finalPayout = Math.round(triggerResult.payoutEstimate * 0.9); // 10% holdback
    steps.push({ step: 5, name: 'Trust-Based Approval', status: 'passed', detail: `High-trust fast-track. Payout: ₹${finalPayout} (10% holdback)`, timestamp: Date.now() + 500, durationMs: 100 });
  } else if (passCount >= 2) {
    currentStatus = 'pending-verification';
    steps.push({ step: 5, name: 'Manual Review Queue', status: 'warning', detail: 'Routed for async verification. Rider can submit proof.', timestamp: Date.now() + 500, durationMs: 100 });
  } else {
    currentStatus = 'flagged';
    steps.push({ step: 5, name: 'Fraud Flag', status: 'failed', detail: `Multiple verification failures. Claim flagged for investigation.`, timestamp: Date.now() + 500, durationMs: 100 });
  }

  const totalTime = steps.reduce((s, st) => s + st.durationMs, 0);
  return { status: currentStatus, payout: finalPayout, steps, processingTimeMs: totalTime, nlpAnalysis: nlp, driftAnalysis: drift };
}

export function generateClaimsSummary(riders) {
  const allClaims = riders.flatMap(r => r.claimHistory.map(c => ({ ...c, riderId: r.id, riderName: r.name, trustScore: r.trustScore })));
  const byStatus = {};
  allClaims.forEach(c => { byStatus[c.status] = (byStatus[c.status] || 0) + 1; });
  const totalPaid = allClaims.filter(c => c.status === 'auto-approved').reduce((s, c) => s + c.amount, 0);
  const totalFlagged = allClaims.filter(c => c.status === 'flagged' || c.status === 'rejected').reduce((s, c) => s + c.amount, 0);
  return { totalClaims: allClaims.length, byStatus, totalPaid, totalFlagged, savedByFraudDetection: totalFlagged, avgProcessingTime: '0.62 seconds', autoApprovalRate: Math.round((byStatus['auto-approved'] || 0) / Math.max(1, allClaims.length) * 100), claims: allClaims.sort((a, b) => new Date(b.date) - new Date(a.date)) };
}
