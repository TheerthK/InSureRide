import React, { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Zap, FileText, ArrowRight, Search } from 'lucide-react';
import { RIDERS } from '../data/mockRiders.js';
import { ZONES, getZoneById } from '../data/zones.js';
import { evaluateTriggers, getTriggerDefinitions, simulateTriggerTimeline } from '../engine/triggerEngine.js';
import { generateClaimsSummary } from '../engine/claimsProcessor.js';
import { analyzeClaimText } from '../engine/fraudDetectionEngine.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function ClaimsManagement() {
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const rider = RIDERS[0];
  const zone = getZoneById(rider.zoneId);
  const triggers = useMemo(() => evaluateTriggers(rider, zone), []);
  const triggerDefs = getTriggerDefinitions();
  const claimsSummary = useMemo(() => generateClaimsSummary(RIDERS), []);
  const timeline = useMemo(() => simulateTriggerTimeline(zone), []);
  const selectedClaim = selectedClaimId ? claimsSummary.claims.find(c => c.id === selectedClaimId) : null;
  const nlpResult = selectedClaim ? analyzeClaimText(selectedClaim.riderDescription) : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Claims Management</h1>
        <p className="text-slate-400 text-sm">Zero-touch automated claims with 5 trigger integrations</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat label="Total Claims" value={claimsSummary.totalClaims} />
        <Stat label="Auto-Approved" value={claimsSummary.byStatus['auto-approved'] || 0} color="text-emerald-400" />
        <Stat label="Flagged" value={(claimsSummary.byStatus['flagged'] || 0) + (claimsSummary.byStatus['rejected'] || 0)} color="text-rose-400" />
        <Stat label="₹ Paid Out" value={`₹${claimsSummary.totalPaid}`} color="text-emerald-400" />
        <Stat label="₹ Saved (Fraud)" value={`₹${claimsSummary.savedByFraudDetection}`} color="text-cyan-400" />
      </div>

      {/* Trigger Monitor */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-cyan-400" /> Live Trigger Monitor</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {triggers.triggers.map(t => (
            <div key={t.id} className={`rounded-xl p-4 border transition-all ${t.fired ? 'bg-rose-500/5 border-rose-500/20' : t.confidence > 40 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-slate-800/30 border-slate-700/50'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{t.icon}</span>
                  <span className="text-sm font-semibold text-white">{t.name}</span>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <p className="text-[11px] text-slate-400 mb-2">{t.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Confidence</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-slate-800 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full transition-all ${t.confidence > 70 ? 'bg-rose-500' : t.confidence > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${t.confidence}%` }} />
                  </div>
                  <span className="text-white font-medium">{t.confidence}%</span>
                </div>
              </div>
              {t.fired && <p className="text-xs text-emerald-400 mt-2 font-medium">Estimated payout: ₹{t.payoutEstimate}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Trigger Timeline */}
      {timeline.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" /> Predicted Trigger Events This Week</h3>
          <div className="flex flex-wrap gap-3">
            {timeline.map((ev, i) => (
              <div key={i} className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-2.5 text-sm">
                <span className="text-amber-400 font-semibold">{ev.day} {ev.hour}:00</span>
                <span className="text-slate-400 mx-2">—</span>
                <span className="text-white">{ev.event}</span>
                <span className="text-xs text-slate-500 ml-2">({ev.confidence}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Claims List + Detail */}
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /> All Claims</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {claimsSummary.claims.map(c => (
              <button key={c.id} onClick={() => setSelectedClaimId(c.id)} className={`w-full text-left flex items-center justify-between p-3 rounded-xl border transition-all ${selectedClaimId === c.id ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'}`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-lg flex-shrink-0">{c.type === 'waterlogging' ? '🌧️' : c.type === 'upi_outage' ? '💳' : c.type === 'heatwave' ? '🔥' : c.type === 'rwa_ban' ? '🏢' : c.type === 'traffic_paralysis' ? '🚧' : '🎪'}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{c.riderName}</p>
                    <p className="text-[10px] text-slate-500">{c.date} · ₹{c.amount}</p>
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </button>
            ))}
          </div>
        </div>

        {/* Claim Detail */}
        <div className="lg:col-span-3 bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          {selectedClaim ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{selectedClaim.id}</h3>
                <StatusBadge status={selectedClaim.status} size="lg" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div><p className="text-xs text-slate-500">Rider</p><p className="text-white font-medium">{selectedClaim.riderName}</p></div>
                <div><p className="text-xs text-slate-500">Type</p><p className="text-white font-medium capitalize">{selectedClaim.type?.replace(/_/g, ' ')}</p></div>
                <div><p className="text-xs text-slate-500">Amount</p><p className="text-white font-medium">₹{selectedClaim.amount}</p></div>
                <div><p className="text-xs text-slate-500">Date</p><p className="text-white font-medium">{selectedClaim.date}</p></div>
              </div>

              {/* Rider Description */}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Rider Description</p>
                <p className="text-sm text-slate-300 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 leading-relaxed">{selectedClaim.riderDescription || 'No description provided'}</p>
              </div>

              {/* NLP Analysis */}
              {nlpResult && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">🧠 NLP Text Analysis</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(nlpResult.dimensions).map(([key, dim]) => (
                      <div key={key} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                        <p className="text-[10px] text-slate-500 capitalize mb-1">{key.replace(/([A-Z])/g, ' $1')}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-white">{dim.score}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${dim.label === 'Detailed' || dim.label === 'Rich' || dim.label === 'Precise' || dim.label === 'Consistent' || dim.label === 'Original' || dim.label === 'Calm' ? 'bg-emerald-500/15 text-emerald-400' : dim.label === 'Vague' || dim.label === 'Absent' || dim.label === 'Template' || dim.label === 'High' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'}`}>{dim.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between bg-slate-800/80 rounded-xl p-3">
                    <div>
                      <p className="text-xs text-slate-400">Overall Fraud Score</p>
                      <p className={`text-lg font-bold ${nlpResult.overallScore > 60 ? 'text-rose-400' : nlpResult.overallScore > 35 ? 'text-amber-400' : 'text-emerald-400'}`}>{nlpResult.overallScore}/100</p>
                    </div>
                    <StatusBadge status={nlpResult.verdict === 'likely_genuine' ? 'low' : nlpResult.verdict === 'needs_review' ? 'medium' : nlpResult.verdict === 'suspicious' ? 'high' : 'critical'} size="lg" />
                  </div>
                  {nlpResult.flags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {nlpResult.flags.map((f, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/15">{f}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Processing Pipeline */}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Zero-Touch Pipeline</p>
                <div className="flex items-center gap-1 overflow-x-auto pb-2">
                  {['Trigger', 'NLP', 'Behavior', 'Trust', 'Decision'].map((step, i) => (
                    <React.Fragment key={step}>
                      <div className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium ${i < 4 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : selectedClaim.status === 'auto-approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                        {i < 4 ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> : null}
                        {step}
                      </div>
                      {i < 4 && <ArrowRight className="w-3 h-3 text-slate-600 flex-shrink-0" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-16">
              <Search className="w-8 h-8 mb-3 opacity-30" />
              <p className="text-sm">Select a claim to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color = 'text-white' }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
