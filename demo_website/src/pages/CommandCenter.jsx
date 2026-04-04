import React, { useMemo } from 'react';
import { ShieldAlert, Zap, Building2, TrendingUp, Users, AlertTriangle, CheckCircle2, UserCheck, Cpu } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { RIDERS } from '../data/mockRiders.js';
import { ZONES } from '../data/zones.js';
import { generateClaimsSummary } from '../engine/claimsProcessor.js';
import { generateFraudIntelligenceReport } from '../engine/fraudDetectionEngine.js';
import { getUPIStatus } from '../data/mockUPIStatusAPI.js';
import StatusBadge from '../components/StatusBadge.jsx';

const mockRiskData = [
  { day: 'Mon', risk: 12, premium: 28, claims: 2 },
  { day: 'Tue', risk: 15, premium: 30, claims: 1 },
  { day: 'Wed', risk: 45, premium: 38, claims: 5 },
  { day: 'Thu', risk: 80, premium: 52, claims: 12 },
  { day: 'Fri', risk: 30, premium: 34, claims: 3 },
  { day: 'Sat', risk: 25, premium: 31, claims: 2 },
  { day: 'Sun', risk: 18, premium: 27, claims: 1 },
];

export default function CommandCenter() {
  const claimsSummary = useMemo(() => generateClaimsSummary(RIDERS), []);
  const fraudReport = useMemo(() => generateFraudIntelligenceReport(RIDERS), []);
  const upiStatus = useMemo(() => getUPIStatus(), []);
  const totalRiders = RIDERS.length;
  const totalPremiums = RIDERS.reduce((s, r) => s + r.weeklyPremium, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2"><Building2 className="w-6 h-6 text-cyan-400" /> Insurer Command Center</h1>
        <p className="text-slate-400 text-sm">Real-time operational intelligence for underwriters and fraud operations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Active Policies" value={`${totalRiders * 1245}`} change="+4.2%" positive />
        <KPICard label="Liquidity Pool" value={`₹${(totalPremiums * 1245 * 0.65 / 100000).toFixed(1)}L`} badge="Secure" badgeColor="emerald" />
        <KPICard label="Auto-Approval Rate" value={`${claimsSummary.autoApprovalRate}%`} change="Target: 70%" />
        <KPICard label="Fraud Flags Today" value={`${fraudReport.summary.critical + fraudReport.summary.high}`} badgeColor="rose" change={`${fraudReport.summary.critical} critical`} positive={false} />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-cyan-400" /> Dynamic Risk & Premium Trend</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockRiskData}>
                <defs>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                  <linearGradient id="premGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
                <Area type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2} fill="url(#riskGrad)" name="Risk Index" />
                <Area type="monotone" dataKey="premium" stroke="#6366f1" strokeWidth={2} fill="url(#premGrad)" name="Premium (₹)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500 text-center mt-2">AI forecasts severe weather Thursday → premium auto-adjusts dynamically</p>
        </div>

        {/* UPI Health */}
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Payment Gateway Health</h3>
          <div className="space-y-3">
            {upiStatus.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-white">{p.name}</p>
                  <p className="text-[10px] text-slate-500">{(p.successRate * 100).toFixed(1)}% success</p>
                </div>
                <StatusBadge status={p.status === 'operational' ? 'active' : 'critical'} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Anti-Spoofing Feed + Claims */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Anti-Spoofing Feed */}
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-rose-400" /> Anti-Spoofing Feed</h3>
          <div className="space-y-3">
            <div className="bg-rose-500/5 border border-rose-500/15 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-rose-400 w-4 h-4" />
                <span className="text-sm font-semibold text-rose-200">High Confidence Spoof</span>
              </div>
              <p className="text-xs text-rose-100/70 mb-2">Cluster {fraudReport.flaggedClusters[0]?.id || '#AX-891'} ({fraudReport.flaggedClusters[0]?.size || 3} accounts)</p>
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between"><span>GPS Position:</span><span className="text-white">Flooded Zone (Whitefield)</span></div>
                <div className="flex justify-between"><span>Sensory Data:</span><span className="text-rose-400 font-medium">Stationary (0.01m/s²)</span></div>
                <div className="flex justify-between"><span>Cell Tower:</span><span className="text-rose-400 font-medium">Mismatched (Electronic City)</span></div>
              </div>
              <button className="mt-3 w-full bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 py-2 rounded-lg text-xs font-semibold transition-colors">Block Syndicate Request</button>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="text-amber-400 w-4 h-4" />
                <span className="text-sm font-semibold text-amber-200">Anomaly Detected</span>
              </div>
              <p className="text-xs text-amber-100/70 mb-2">Rider: {fraudReport.topRisks[0]?.riderName || 'Unknown'}</p>
              <div className="space-y-1 text-xs text-slate-400">
                <div className="flex justify-between"><span>Fraud Trajectory:</span><span className="text-amber-400">{fraudReport.topRisks[0]?.trajectoryScore || 0}/100</span></div>
                <div className="flex justify-between"><span>Intervention:</span><span className="text-white">{fraudReport.topRisks[0]?.intervention?.replace(/_/g, ' ') || 'None'}</span></div>
              </div>
              <button className="mt-3 w-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 py-2 rounded-lg text-xs font-semibold transition-colors">Request Async Proof</button>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="text-emerald-400 w-4 h-4" />
                <span className="text-sm font-semibold text-emerald-200">Auto-Resolved</span>
              </div>
              <p className="text-xs text-emerald-100/70">{RIDERS[3]?.name || 'High-Trust Rider'} (Trust: {RIDERS[3]?.trustScore || 95}) — Benefit of Doubt auto-approval.</p>
            </div>
          </div>
        </div>

        {/* Claims Overview */}
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" /> Claims Operations Summary</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{claimsSummary.totalClaims}</p>
              <p className="text-[10px] text-slate-500">Total Claims</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-emerald-400">₹{claimsSummary.totalPaid}</p>
              <p className="text-[10px] text-slate-500">Paid Out</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-cyan-400">₹{claimsSummary.savedByFraudDetection}</p>
              <p className="text-[10px] text-slate-500">Saved by AI</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{claimsSummary.avgProcessingTime}</p>
              <p className="text-[10px] text-slate-500">Avg Process Time</p>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="space-y-2">
            {Object.entries(claimsSummary.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between bg-slate-800/30 rounded-lg px-3 py-2">
                <StatusBadge status={status} />
                <span className="text-sm font-bold text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zone Risk Monitor */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-indigo-400" /> Zone Operations Monitor</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {ZONES.map(z => (
            <div key={z.id} className={`rounded-xl p-3 border text-center ${z.safetyClassification === 'high-risk' ? 'bg-rose-500/5 border-rose-500/15' : z.safetyClassification === 'moderate-risk' ? 'bg-amber-500/5 border-amber-500/15' : 'bg-emerald-500/5 border-emerald-500/15'}`}>
              <p className="text-xs text-slate-400 mb-1 truncate">{z.name}</p>
              <p className="text-lg font-bold text-white">{z.riderDensity}</p>
              <p className="text-[10px] text-slate-500">riders</p>
              <StatusBadge status={z.safetyClassification === 'high-risk' ? 'critical' : z.safetyClassification === 'moderate-risk' ? 'medium' : 'low'} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, change, positive, badge, badgeColor = 'emerald' }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
      <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {change && <p className={`text-xs mt-1 ${positive ? 'text-emerald-400' : positive === false ? 'text-rose-400' : 'text-slate-500'}`}>{change}</p>}
      {badge && <span className={`text-[10px] px-2 py-0.5 rounded-full bg-${badgeColor}-500/10 text-${badgeColor}-400 border border-${badgeColor}-500/20 mt-1 inline-block`}>{badge}</span>}
    </div>
  );
}
