import React, { useMemo, useState } from 'react';
import { Brain, AlertTriangle, Users, Clock, TrendingUp, Eye, Shield, Fingerprint } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell } from 'recharts';
import { RIDERS } from '../data/mockRiders.js';
import { generateFraudIntelligenceReport, analyzeClaimText } from '../engine/fraudDetectionEngine.js';
import StatusBadge from '../components/StatusBadge.jsx';
import RiskGauge from '../components/RiskGauge.jsx';

export default function FraudIntelligence() {
  const [selectedRiderId, setSelectedRiderId] = useState(null);
  const [nlpTestText, setNlpTestText] = useState('');

  const report = useMemo(() => generateFraudIntelligenceReport(RIDERS), []);
  const selectedTrajectory = selectedRiderId ? report.trajectories.find(t => t.riderId === selectedRiderId) : null;
  const nlpTestResult = nlpTestText.trim() ? analyzeClaimText(nlpTestText) : null;

  const trajectoryChart = report.trajectories.map(t => ({
    name: t.riderName.split(' ')[0],
    score: t.trajectoryScore,
    drift: t.components.behavioralDrift,
    nlp: t.components.nlpFraudAvg,
    trust: RIDERS.find(r => r.id === t.riderId)?.trustScore || 50,
  }));

  const scatterData = report.trajectories.map(t => {
    const rider = RIDERS.find(r => r.id === t.riderId);
    return { x: rider?.trustScore || 50, y: t.trajectoryScore, z: t.components.behavioralDrift, name: t.riderName, id: t.riderId };
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Brain className="w-6 h-6 text-violet-400" /> Pre-Emptive Fraud Intelligence
        </h1>
        <p className="text-slate-400 text-sm">Predicting fraud <span className="text-violet-400 font-semibold">before</span> claims are filed — behavioral drift, NLP analysis, social graph detection</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-rose-500/5 border border-rose-500/15 rounded-xl p-4">
          <p className="text-xs text-rose-400/70 mb-1">Critical Risk</p>
          <p className="text-3xl font-bold text-rose-400">{report.summary.critical}</p>
          <p className="text-[10px] text-slate-500">Riders flagged for investigation</p>
        </div>
        <div className="bg-orange-500/5 border border-orange-500/15 rounded-xl p-4">
          <p className="text-xs text-orange-400/70 mb-1">High Risk</p>
          <p className="text-3xl font-bold text-orange-400">{report.summary.high}</p>
          <p className="text-[10px] text-slate-500">Enhanced monitoring</p>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4">
          <p className="text-xs text-amber-400/70 mb-1">Elevated</p>
          <p className="text-3xl font-bold text-amber-400">{report.summary.elevated}</p>
          <p className="text-[10px] text-slate-500">Trust-building outreach</p>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4">
          <p className="text-xs text-emerald-400/70 mb-1">Low Risk</p>
          <p className="text-3xl font-bold text-emerald-400">{report.summary.low}</p>
          <p className="text-[10px] text-slate-500">No action required</p>
        </div>
      </div>

      {/* Fraud Trajectory Chart */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-violet-400" /> Fraud Trajectory Scores — All Riders</h3>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trajectoryChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
              <Bar dataKey="score" name="Fraud Score" radius={[4, 4, 0, 0]}>
                {trajectoryChart.map((entry, i) => (
                  <Cell key={i} fill={entry.score > 70 ? '#ef4444' : entry.score > 50 ? '#f97316' : entry.score > 30 ? '#eab308' : '#22c55e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trust vs Fraud Scatter + Rider List */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2"><Fingerprint className="w-4 h-4 text-cyan-400" /> Trust Score vs Fraud Trajectory</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ bottom: 20, left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" dataKey="x" name="Trust" stroke="#94a3b8" fontSize={11} label={{ value: 'Trust Score', position: 'bottom', fill: '#64748b', fontSize: 10 }} domain={[0, 100]} />
                <YAxis type="number" dataKey="y" name="Fraud" stroke="#94a3b8" fontSize={11} label={{ value: 'Fraud Risk', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} domain={[0, 100]} />
                <ZAxis type="number" dataKey="z" range={[40, 200]} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} formatter={(value, name) => [value, name === 'x' ? 'Trust' : name === 'y' ? 'Fraud' : 'Drift']} />
                <Scatter data={scatterData} cursor="pointer">
                  {scatterData.map((entry, i) => (
                    <Cell key={i} fill={entry.y > 70 ? '#ef4444' : entry.y > 50 ? '#f97316' : entry.y > 30 ? '#eab308' : '#22c55e'} onClick={() => setSelectedRiderId(entry.id)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-500 text-center mt-2">Click a dot to view rider's fraud analysis. Bottom-right = safe. Top-left = dangerous.</p>
        </div>

        {/* Top Risk Riders */}
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-400" /> Risk-Ranked Riders</h3>
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {report.trajectories.map(t => (
              <button key={t.riderId} onClick={() => setSelectedRiderId(t.riderId)} className={`w-full text-left flex items-center justify-between p-3 rounded-xl border transition-all ${selectedRiderId === t.riderId ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'}`}>
                <div className="flex items-center gap-3">
                  <RiskGauge score={t.trajectoryScore} size={50} label="" />
                  <div>
                    <p className="text-sm font-medium text-white">{t.riderName}</p>
                    <p className="text-[10px] text-slate-500">{t.riderId} · Intervention: {t.intervention.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <StatusBadge status={t.riskLevel} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Rider Deep Analysis */}
      {selectedTrajectory && (
        <div className="bg-slate-900/50 border border-violet-500/20 rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Eye className="w-5 h-5 text-violet-400" /> Deep Analysis — {selectedTrajectory.riderName}</h3>
            <StatusBadge status={selectedTrajectory.riskLevel} size="lg" />
          </div>

          {/* Component Scores */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <CompScore label="Behavioral Drift" value={selectedTrajectory.components.behavioralDrift} />
            <CompScore label="NLP Fraud Avg" value={selectedTrajectory.components.nlpFraudAvg} />
            <CompScore label="Social Graph" value={selectedTrajectory.components.socialGraphRisk} />
            <CompScore label="Trust Penalty" value={selectedTrajectory.components.trustPenalty} />
            <CompScore label="Escalation" value={selectedTrajectory.components.escalationScore} />
          </div>

          {/* Behavioral Signals */}
          {selectedTrajectory.behavioralDriftDetail.signals.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Behavioral Anomaly Signals</p>
              <div className="space-y-2">
                {selectedTrajectory.behavioralDriftDetail.signals.map((sig, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${sig.severity === 'critical' ? 'bg-rose-500/10 text-rose-300 border border-rose-500/15' : sig.severity === 'high' ? 'bg-orange-500/10 text-orange-300 border border-orange-500/15' : 'bg-amber-500/10 text-amber-300 border border-amber-500/15'}`}>
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    <span>{sig.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NLP Scores per Claim */}
          {selectedTrajectory.nlpScores.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">NLP Analysis — Per-Claim Text Scoring</p>
              <div className="space-y-2">
                {selectedTrajectory.nlpScores.map((nlp, i) => (
                  <div key={i} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-bold ${nlp.overallScore > 60 ? 'text-rose-400' : nlp.overallScore > 35 ? 'text-amber-400' : 'text-emerald-400'}`}>Score: {nlp.overallScore}/100</span>
                      <StatusBadge status={nlp.verdict === 'likely_genuine' ? 'low' : nlp.verdict === 'needs_review' ? 'medium' : nlp.verdict === 'suspicious' ? 'high' : 'critical'} />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(nlp.dimensions).map(([k, v]) => (
                        <span key={k} className={`text-[10px] px-1.5 py-0.5 rounded ${v.score > 50 && (k === 'specificity' || k === 'temporalPrecision' || k === 'sensoryDetail' || k === 'consistency') ? 'bg-emerald-500/10 text-emerald-400' : v.score > 50 ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-700/50 text-slate-400'}`}>{k.slice(0, 6)}: {v.score}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Intervention */}
          <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl p-4">
            <p className="text-xs text-violet-400 font-semibold uppercase tracking-wider mb-1">Recommended Intervention</p>
            <p className="text-sm text-slate-300">{selectedTrajectory.interventionDetails}</p>
          </div>
        </div>
      )}

      {/* Social Graph Clusters */}
      {report.socialGraph.clusters.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-rose-400" /> Detected Fraud Ring Clusters</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {report.socialGraph.clusters.map(c => (
              <div key={c.id} className="bg-rose-500/5 border border-rose-500/15 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-semibold text-white">{c.id}</p>
                  <StatusBadge status={c.riskLevel} />
                </div>
                <p className="text-xs text-slate-400 mb-2">{c.size} riders · Avg trust: {c.avgTrustScore}</p>
                <div className="flex flex-wrap gap-1">
                  {c.members.map(m => {
                    const r = RIDERS.find(x => x.id === m);
                    return <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300">{r?.name || m}</span>;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Temporal Patterns */}
      {report.temporalPatterns.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" /> Temporal Anomaly Patterns</h3>
          <div className="space-y-2">
            {report.temporalPatterns.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-xs bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2 text-amber-300">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span>{p.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NLP Live Tester */}
      <div className="bg-slate-900/50 border border-violet-500/20 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">🧠 Live NLP Claim Analyzer</h3>
        <p className="text-xs text-slate-400 mb-3">Paste any claim description to see real-time fraud scoring</p>
        <textarea value={nlpTestText} onChange={e => setNlpTestText(e.target.value)} rows={4} placeholder="e.g. Road was blocked. Water everywhere. Could not move for one hour..." className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 resize-none" />
        {nlpTestResult && (
          <div className="mt-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <p className={`text-xl font-bold ${nlpTestResult.overallScore > 60 ? 'text-rose-400' : nlpTestResult.overallScore > 35 ? 'text-amber-400' : 'text-emerald-400'}`}>Fraud Score: {nlpTestResult.overallScore}/100</p>
              <StatusBadge status={nlpTestResult.verdict === 'likely_genuine' ? 'low' : nlpTestResult.verdict === 'needs_review' ? 'medium' : nlpTestResult.verdict === 'suspicious' ? 'high' : 'critical'} size="lg" />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
              {Object.entries(nlpTestResult.dimensions).map(([k, v]) => (
                <div key={k} className="text-center">
                  <p className="text-lg font-bold text-white">{v.score}</p>
                  <p className="text-[9px] text-slate-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</p>
                  <p className={`text-[9px] ${v.label === 'Detailed' || v.label === 'Rich' || v.label === 'Precise' || v.label === 'Consistent' || v.label === 'Original' || v.label === 'Calm' ? 'text-emerald-400' : v.label === 'Template' || v.label === 'Vague' || v.label === 'Absent' || v.label === 'High' ? 'text-rose-400' : 'text-amber-400'}`}>{v.label}</p>
                </div>
              ))}
            </div>
            {nlpTestResult.flags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {nlpTestResult.flags.map((f, i) => <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/15">{f}</span>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CompScore({ label, value }) {
  const color = value > 50 ? 'text-rose-400' : value > 25 ? 'text-amber-400' : 'text-emerald-400';
  return (
    <div className="bg-slate-800/50 rounded-xl p-3 text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}
