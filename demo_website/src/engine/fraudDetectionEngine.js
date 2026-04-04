/**
 * PRE-EMPTIVE FRAUD DETECTION ENGINE
 * 
 * Five modules:
 * 1. Behavioral Drift Detector — z-score anomaly detection
 * 2. NLP Claim Text Analyzer — multi-dimensional text scoring
 * 3. Temporal Pattern Miner — suspicious timing detection
 * 4. Social Graph Analyzer — fraud ring detection
 * 5. Pre-Filing Risk Predictor — composite trajectory scoring
 */

function zScore(value, mean, stdDev) {
  if (stdDev === 0) return value === mean ? 0 : 3.0;
  return (value - mean) / stdDev;
}

function stdDeviation(values) {
  if (values.length < 2) return 1;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sq = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(sq.reduce((a, b) => a + b, 0) / (values.length - 1));
}

export function analyzeBehavioralDrift(rider) {
  const bl = rider.behavioralBaseline;
  const claims = rider.claimHistory;
  if (claims.length === 0) return { overallDrift: 0, signals: [], riskLevel: 'none', details: {} };

  const signals = [];
  const details = {};

  const joinedMo = rider.joinedWeeksAgo / 4.33;
  const actualRate = claims.length / Math.max(1, joinedMo);
  const fz = zScore(actualRate, bl.avgClaimsPerMonth, bl.avgClaimsPerMonth * 0.3);
  details.claimFrequency = { actual: Math.round(actualRate * 100) / 100, expected: bl.avgClaimsPerMonth, zScore: Math.round(fz * 100) / 100, anomalous: Math.abs(fz) > 2 };
  if (Math.abs(fz) > 2) signals.push({ type: 'frequency_anomaly', severity: Math.abs(fz) > 3 ? 'critical' : 'high', message: `Claim freq ${fz > 0 ? 'spike' : 'drop'}: ${actualRate.toFixed(1)}/mo vs ${bl.avgClaimsPerMonth}/mo`, zScore: fz });

  const amounts = claims.map(c => c.amount);
  const avgAmt = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const az = zScore(avgAmt, bl.avgClaimAmount, bl.avgClaimAmount * 0.25);
  details.claimAmount = { avgRecent: Math.round(avgAmt), expected: bl.avgClaimAmount, zScore: Math.round(az * 100) / 100, anomalous: Math.abs(az) > 2 };
  if (Math.abs(az) > 2) signals.push({ type: 'amount_anomaly', severity: Math.abs(az) > 3 ? 'critical' : 'high', message: `Avg claim ₹${Math.round(avgAmt)} vs baseline ₹${bl.avgClaimAmount}`, zScore: az });

  const dayDist = {};
  claims.forEach(c => { const d = new Date(c.date).toLocaleDateString('en-US', { weekday: 'short' }); dayDist[d] = (dayDist[d] || 0) + 1; });
  const maxDay = Math.max(...Object.values(dayDist));
  const conc = maxDay / claims.length;
  details.dayConcentration = { distribution: dayDist, maxConcentration: Math.round(conc * 100), anomalous: conc > 0.5 && claims.length > 2 };
  if (conc > 0.5 && claims.length > 2) { const pk = Object.entries(dayDist).sort((a, b) => b[1] - a[1])[0][0]; signals.push({ type: 'day_concentration', severity: conc > 0.7 ? 'critical' : 'high', message: `${Math.round(conc * 100)}% of claims on ${pk}`, concentration: conc }); }

  let regScore = 0;
  if (claims.length >= 2) {
    const sorted = [...claims].sort((a, b) => new Date(a.date) - new Date(b.date));
    const gaps = [];
    for (let i = 1; i < sorted.length; i++) gaps.push((new Date(sorted[i].date) - new Date(sorted[i-1].date)) / 86400000);
    const avgG = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const gSD = stdDeviation(gaps);
    regScore = gSD < 2 && gaps.length >= 2 ? 100 : gSD < 5 ? 60 : 10;
    details.timingRegularity = { avgGapDays: Math.round(avgG * 10) / 10, gapStdDev: Math.round(gSD * 10) / 10, regularityScore: regScore, anomalous: regScore > 50 };
    if (regScore > 50) signals.push({ type: 'timing_regularity', severity: regScore > 80 ? 'critical' : 'medium', message: `Claims every ~${avgG.toFixed(1)} days (σ=${gSD.toFixed(1)})`, regularityScore: regScore });
  }

  const zoneCount = new Set(bl.topClaimZones).size;
  details.zonePattern = { uniqueZones: zoneCount, zones: bl.topClaimZones, anomalous: zoneCount >= 3 };
  if (zoneCount >= 3) signals.push({ type: 'zone_hopping', severity: 'medium', message: `Claims across ${zoneCount} zones`, zoneCount });

  const drift = Math.min(100, (Math.abs(fz) > 2 ? 25 : Math.abs(fz) * 8) + (Math.abs(az) > 2 ? 20 : Math.abs(az) * 6) + (conc > 0.5 ? conc * 30 : 5) + (regScore > 50 ? 15 : 0) + (zoneCount >= 3 ? 10 : 0));
  return { overallDrift: Math.round(drift), signals, riskLevel: drift > 70 ? 'critical' : drift > 45 ? 'high' : drift > 20 ? 'medium' : 'low', details };
}

const VAGUE = ['somewhere', 'around', 'maybe', 'think', 'not sure', 'some area', 'lost all'];
const URGENT = ['please pay', 'please process', 'immediately', 'urgent', 'asap', 'need money'];
const SPECIFIC = ['exactly', 'block', 'tower', 'floor', 'road', 'junction', 'signal', 'building', 'shelter', 'Main', 'metres', 'meters'];
const SENSORY = ['saw', 'felt', 'heard', 'noticed', 'observed', 'could see', 'drank', 'dizzy', 'radiating', 'unbearable'];
const TEMPLATES = ['road was blocked', 'water everywhere', 'could not move', 'cannot deliver', 'please process payout', 'lost all deliveries', 'traffic jam', 'payment not working'];

export function analyzeClaimText(text) {
  if (!text || text.trim().length === 0) return { overallScore: 95, dimensions: {}, flags: ['No description'], verdict: 'highly_suspicious' };
  const lo = text.toLowerCase(), words = text.split(/\s+/);
  const vC = VAGUE.filter(v => lo.includes(v)).length;
  const sC = SPECIFIC.filter(s => text.includes(s) || lo.includes(s.toLowerCase())).length;
  const nums = (text.match(/\d+/g) || []).length;
  const timeRefs = (text.match(/\d{1,2}:\d{2}|[0-9]+\s*(pm|am|PM|AM)/g) || []).length;
  const locNames = (text.match(/[A-Z][a-z]+\s*(Road|Block|Tower|Main|Layout|Nagar|Junction|Floor)/g) || []).length;
  const specScore = Math.max(0, Math.min(100, 30 + sC * 12 + nums * 8 + timeRefs * 15 + locNames * 18 - vC * 20));
  const uC = URGENT.filter(u => lo.includes(u)).length;
  const emotScore = Math.min(100, uC * 25 + (text.match(/!/g) || []).length * 15);
  const tempPrec = Math.min(100, timeRefs * 30 + (lo.includes('minutes') || lo.includes('mins') ? 20 : 0) + (text.match(/\d+\s*(min|minute|hour|mins)/g) || []).length * 20);
  let consScore = 85;
  if (lo.includes('rain') && lo.includes('heat')) consScore -= 20;
  const tM = TEMPLATES.filter(t => lo.includes(t)).length;
  const templScore = Math.min(100, tM * 25 + (words.length < 15 ? 30 : words.length < 30 ? 10 : 0));
  const senC = SENSORY.filter(s => lo.includes(s)).length;
  const sensScore = Math.min(100, senC * 20 + (words.length > 60 ? 15 : 0));
  const fraud = Math.round((100 - specScore) * 0.25 + emotScore * 0.15 + (100 - tempPrec) * 0.15 + (100 - consScore) * 0.10 + templScore * 0.25 + (100 - sensScore) * 0.10);
  const flags = [];
  if (specScore < 30) flags.push('Vague description');
  if (emotScore > 50) flags.push('Urgency language');
  if (templScore > 50) flags.push('Template phrasing');
  if (sensScore < 20 && words.length > 10) flags.push('No sensory details');
  if (words.length < 12) flags.push('Suspiciously brief');
  return {
    overallScore: Math.max(0, Math.min(100, fraud)),
    dimensions: {
      specificity: { score: specScore, label: specScore > 60 ? 'Detailed' : specScore > 30 ? 'Moderate' : 'Vague' },
      emotionalIntensity: { score: emotScore, label: emotScore > 50 ? 'High' : emotScore > 20 ? 'Moderate' : 'Calm' },
      temporalPrecision: { score: tempPrec, label: tempPrec > 50 ? 'Precise' : tempPrec > 20 ? 'Approximate' : 'Vague' },
      consistency: { score: consScore, label: consScore > 70 ? 'Consistent' : 'Mixed' },
      templateMatch: { score: templScore, label: templScore > 50 ? 'Template' : templScore > 20 ? 'Partial' : 'Original' },
      sensoryDetail: { score: sensScore, label: sensScore > 40 ? 'Rich' : sensScore > 15 ? 'Moderate' : 'Absent' }
    },
    flags, wordCount: words.length,
    verdict: fraud > 65 ? 'highly_suspicious' : fraud > 40 ? 'suspicious' : fraud > 20 ? 'needs_review' : 'likely_genuine'
  };
}

export function mineTemporalPatterns(allClaims) {
  const patterns = [];
  const byDate = {};
  allClaims.forEach(c => { if (!byDate[c.date]) byDate[c.date] = []; byDate[c.date].push(c); });
  for (const [date, dc] of Object.entries(byDate)) {
    if (dc.length < 2) continue;
    const times = dc.map(c => { const [h, m] = c.time.split(':').map(Number); return h * 60 + m; }).sort((a, b) => a - b);
    for (let i = 1; i < times.length; i++) {
      if (times[i] - times[i-1] <= 30) {
        const involved = dc.filter(c => { const [h, m] = c.time.split(':').map(Number); const t = h * 60 + m; return Math.abs(t - times[i]) <= 30 || Math.abs(t - times[i-1]) <= 30; });
        if (involved.length >= 2) patterns.push({ type: 'synchronized_claims', severity: involved.length >= 3 ? 'critical' : 'high', date, involvedRiders: involved.map(c => c.riderId), message: `${involved.length} claims within 30-min on ${date}` });
      }
    }
  }
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayCnts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  allClaims.forEach(c => { dayCnts[days[new Date(c.date).getDay()]]++; });
  const exp = (allClaims.length || 1) / 7;
  for (const [d, cnt] of Object.entries(dayCnts)) {
    if (cnt > exp * 2.5 && cnt >= 3) patterns.push({ type: 'day_clustering', severity: 'high', day: d, count: cnt, expected: Math.round(exp * 10) / 10, message: `${cnt} claims on ${d}s vs expected ${exp.toFixed(1)}` });
  }
  return patterns;
}

function textSimilarity(t1, t2) {
  const w1 = new Set(t1.split(/\s+/).filter(w => w.length > 3));
  const w2 = new Set(t2.split(/\s+/).filter(w => w.length > 3));
  const inter = [...w1].filter(w => w2.has(w)).length;
  const union = new Set([...w1, ...w2]).size;
  return union === 0 ? 0 : inter / union;
}

export function analyzeSocialGraph(riders) {
  const nodes = riders.map(r => ({ id: r.id, name: r.name, trustScore: r.trustScore, claimCount: r.claimHistory.length }));
  const edges = [];
  for (let i = 0; i < riders.length; i++) {
    for (let j = i + 1; j < riders.length; j++) {
      let co = 0;
      const z1 = new Set(riders[i].behavioralBaseline.topClaimZones);
      const z2 = new Set(riders[j].behavioralBaseline.topClaimZones);
      co += [...z1].filter(z => z2.has(z)).length * 2;
      const d1 = new Set(riders[i].claimHistory.map(c => c.date));
      const d2 = new Set(riders[j].claimHistory.map(c => c.date));
      co += [...d1].filter(d => d2.has(d)).length * 3;
      if (Math.abs(riders[i].behavioralBaseline.avgClaimAmount - riders[j].behavioralBaseline.avgClaimAmount) < 15) co += 2;
      const tx1 = riders[i].claimHistory.map(c => c.riderDescription?.toLowerCase() || '');
      const tx2 = riders[j].claimHistory.map(c => c.riderDescription?.toLowerCase() || '');
      for (const a of tx1) for (const b of tx2) if (a.length > 10 && b.length > 10 && textSimilarity(a, b) > 0.6) co += 4;
      if (co >= 5) edges.push({ source: riders[i].id, target: riders[j].id, weight: co, suspicious: co >= 8 });
    }
  }
  const parent = {};
  nodes.forEach(n => { parent[n.id] = n.id; });
  const find = x => { if (parent[x] !== x) parent[x] = find(parent[x]); return parent[x]; };
  edges.filter(e => e.suspicious).forEach(e => { parent[find(e.source)] = find(e.target); });
  const cm = {};
  nodes.forEach(n => { const r = find(n.id); if (!cm[r]) cm[r] = []; cm[r].push(n.id); });
  const clusters = Object.values(cm).filter(m => m.length >= 2).map((m, i) => ({ id: `CLUSTER-${i+1}`, members: m, size: m.length, riskLevel: m.length >= 3 ? 'critical' : 'high', avgTrustScore: Math.round(m.reduce((s, id) => s + (nodes.find(n => n.id === id)?.trustScore || 0), 0) / m.length) }));
  return { nodes, edges, clusters };
}

export function predictFraudTrajectory(rider, allRiders) {
  const bd = analyzeBehavioralDrift(rider);
  const nlp = rider.claimHistory.map(c => analyzeClaimText(c.riderDescription));
  const avgNlp = nlp.length > 0 ? nlp.reduce((s, n) => s + n.overallScore, 0) / nlp.length : 0;
  const sg = analyzeSocialGraph(allRiders);
  const rc = sg.clusters.filter(c => c.members.includes(rider.id));
  const clRisk = rc.length > 0 ? (rc[0].riskLevel === 'critical' ? 30 : 20) : 0;
  const tP = rider.trustScore < 50 ? (50 - rider.trustScore) * 0.5 : 0;
  let esc = 0;
  if (rider.claimHistory.length >= 3) {
    const a = rider.claimHistory.map(c => c.amount);
    const rA = a.slice(-2).reduce((x, y) => x + y, 0) / 2;
    const oA = a.slice(0, -2).reduce((x, y) => x + y, 0) / Math.max(1, a.length - 2);
    if (rA > oA * 1.2) esc = 15;
  }
  const traj = Math.min(100, Math.round(bd.overallDrift * 0.30 + avgNlp * 0.25 + clRisk * 0.20 + tP * 0.15 + esc * 0.10));
  let intervention = 'none';
  if (traj > 70) intervention = 'flag_for_investigation';
  else if (traj > 50) intervention = 'enhanced_monitoring';
  else if (traj > 30) intervention = 'trust_building_outreach';
  const interventionMap = { flag_for_investigation: 'Route to investigation. Block auto-approval.', enhanced_monitoring: 'Enable real-time telemetry verification.', trust_building_outreach: 'Send trust-building engagement.', none: 'No action required.' };
  return { riderId: rider.id, riderName: rider.name, trajectoryScore: traj, riskLevel: traj > 70 ? 'critical' : traj > 50 ? 'high' : traj > 30 ? 'elevated' : 'low', components: { behavioralDrift: bd.overallDrift, nlpFraudAvg: Math.round(avgNlp), socialGraphRisk: clRisk, trustPenalty: Math.round(tP), escalationScore: esc }, behavioralDriftDetail: bd, nlpScores: nlp, clusters: rc, intervention, interventionDetails: interventionMap[intervention] };
}

export function generateFraudIntelligenceReport(riders) {
  const allClaims = riders.flatMap(r => r.claimHistory.map(c => ({ ...c, riderId: r.id })));
  const tp = mineTemporalPatterns(allClaims);
  const sg = analyzeSocialGraph(riders);
  const trajs = riders.map(r => predictFraudTrajectory(r, riders)).sort((a, b) => b.trajectoryScore - a.trajectoryScore);
  return { timestamp: new Date().toISOString(), totalRiders: riders.length, summary: { critical: trajs.filter(t => t.riskLevel === 'critical').length, high: trajs.filter(t => t.riskLevel === 'high').length, elevated: trajs.filter(t => t.riskLevel === 'elevated').length, low: trajs.filter(t => t.riskLevel === 'low').length }, trajectories: trajs, temporalPatterns: tp, socialGraph: sg, flaggedClusters: sg.clusters.filter(c => c.riskLevel === 'critical'), topRisks: trajs.slice(0, 5) };
}
