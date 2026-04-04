import React, { useState, useMemo } from 'react';
import { Calculator, TrendingUp, TrendingDown, MapPin, Shield, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { RIDERS } from '../data/mockRiders.js';
import { ZONES, getZoneById } from '../data/zones.js';
import { calculatePremium, compareZonePremiums, weeklyPremiumForecast } from '../engine/premiumEngine.js';

export default function PremiumCalculator() {
  const [selectedRiderId, setSelectedRiderId] = useState(RIDERS[0].id);
  const [selectedZoneId, setSelectedZoneId] = useState(RIDERS[0].zoneId);
  const rider = RIDERS.find(r => r.id === selectedRiderId) || RIDERS[0];
  const zone = getZoneById(selectedZoneId) || ZONES[0];

  const premium = useMemo(() => calculatePremium({ ...rider, zoneId: selectedZoneId }, zone), [selectedRiderId, selectedZoneId]);
  const zoneComparison = useMemo(() => compareZonePremiums(rider, ZONES), [selectedRiderId]);
  const forecast = useMemo(() => weeklyPremiumForecast(rider, zone), [selectedRiderId, selectedZoneId]);

  const breakdownData = useMemo(() => {
    const b = premium.breakdown;
    return [
      { name: 'Base Rate', value: b.baseRate, color: '#6366f1' },
      { name: 'Risk Loading', value: b.riskLoading.total, color: '#ef4444' },
      { name: 'Season', value: b.seasonalAdjustment.amount, color: '#f97316' },
      { name: 'Weather', value: b.weatherSurcharge.amount, color: '#eab308' },
      { name: 'Claim Load', value: b.claimHistoryLoading.amount, color: '#8b5cf6' },
      { name: 'Trust (-)', value: -b.trustDiscount.amount, color: '#22c55e' },
      { name: 'Safe Zone (-)', value: -b.safeZoneDiscount.amount, color: '#14b8a6' },
    ];
  }, [premium]);

  const riskRadar = useMemo(() => {
    const dims = premium.compositeRisk.dimensions;
    return [
      { factor: 'Waterlog', value: dims.waterlogging.probability, fullMark: 100 },
      { factor: 'Heat', value: dims.heatwave.probability, fullMark: 100 },
      { factor: 'Traffic', value: dims.traffic.probability, fullMark: 100 },
      { factor: 'UPI', value: dims.upi.probability, fullMark: 100 },
      { factor: 'RWA', value: dims.rwa.probability, fullMark: 100 },
    ];
  }, [premium]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2"><Calculator className="w-6 h-6 text-indigo-400" /> Dynamic Premium Calculator</h1>
        <p className="text-slate-400 text-sm">See exactly how your weekly premium is calculated — every factor explained</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Rider</label>
          <select value={selectedRiderId} onChange={e => { setSelectedRiderId(e.target.value); const r = RIDERS.find(x => x.id === e.target.value); if (r) setSelectedZoneId(r.zoneId); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white">
            {RIDERS.map(r => <option key={r.id} value={r.id}>{r.name} (Trust: {r.trustScore})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Zone</label>
          <select value={selectedZoneId} onChange={e => setSelectedZoneId(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white">
            {ZONES.map(z => <option key={z.id} value={z.id}>{z.name} ({z.safetyClassification})</option>)}
          </select>
        </div>
      </div>

      {/* Main Premium Display */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <p className="text-indigo-200 text-sm font-medium mb-1">Weekly Premium</p>
          <p className="text-5xl font-bold text-white mb-2">₹{premium.finalPremium}</p>
          <p className="text-xs text-indigo-200/70">Coverage: ₹{premium.coverageLimit}/week</p>
          <p className="text-xs text-indigo-200/70 mt-1">{premium.plan.name} Plan · {premium.breakdown.seasonalAdjustment.season} season</p>
        </div>

        {/* Factor Breakdown Chart */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Factor-by-Factor Breakdown (₹)</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdownData} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={75} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {breakdownData.map((entry, i) => (
                    <rect key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Risk Radar + Detailed Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Risk Profile Radar — {zone.name}</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={riskRadar}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="factor" stroke="#94a3b8" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={9} />
                <Radar name="Risk %" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2"><Info className="w-4 h-4 text-indigo-400" /> Calculation Details</h3>
          <div className="space-y-3 text-sm">
            <Row label="Base Rate" value={`₹${premium.breakdown.baseRate}`} desc="Minimum viable cost" />
            {Object.entries(premium.breakdown.riskLoading.dimensions).map(([dim, data]) => (
              <Row key={dim} label={`${dim} risk`} value={`+₹${data.loading}`} desc={`${data.probability}% probability × ${data.weight} weight`} />
            ))}
            <Row label={`Season (${premium.breakdown.seasonalAdjustment.season})`} value={`+₹${premium.breakdown.seasonalAdjustment.amount}`} desc={`${premium.breakdown.seasonalAdjustment.multiplier}× multiplier`} />
            <Row label="Weather surcharge" value={`+₹${premium.breakdown.weatherSurcharge.amount}`} desc={premium.breakdown.weatherSurcharge.reason} />
            <Row label="Claim loading" value={`+₹${premium.breakdown.claimHistoryLoading.amount}`} desc={`${(premium.breakdown.claimHistoryLoading.ratio * 100).toFixed(0)}% above baseline`} positive={false} />
            <Row label="Trust discount" value={`-₹${premium.breakdown.trustDiscount.amount}`} desc={`Trust ${premium.breakdown.trustDiscount.trustScore}/100`} positive={true} />
            <Row label="Safe zone disc." value={`-₹${premium.breakdown.safeZoneDiscount.amount}`} desc={`${premium.breakdown.safeZoneDiscount.safeWeeksStreak} safe week streak`} positive={true} />
            <div className="pt-2 border-t border-slate-700/50 flex justify-between font-bold">
              <span className="text-white">Final Premium</span>
              <span className="text-indigo-400">₹{premium.finalPremium}/week</span>
            </div>
          </div>
        </div>
      </div>

      {/* Zone Comparison */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-cyan-400" /> Zone Premium Comparison</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {zoneComparison.map(zc => (
            <div key={zc.zoneId} className={`rounded-xl p-4 border text-center transition-all cursor-pointer ${zc.zoneId === selectedZoneId ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'}`} onClick={() => setSelectedZoneId(zc.zoneId)}>
              <p className="text-xs text-slate-400 mb-1">{zc.zone}</p>
              <p className="text-2xl font-bold text-white">₹{zc.finalPremium}</p>
              <p className="text-[10px] text-slate-500">Risk: {zc.compositeRisk.composite}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Forecast */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">4-Week Premium Forecast</h3>
        <div className="grid grid-cols-4 gap-3">
          {forecast.map(w => (
            <div key={w.week} className="bg-slate-800/50 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400 mb-1">{w.label}</p>
              <p className="text-xl font-bold text-white">₹{w.premium}</p>
              <div className={`flex items-center justify-center gap-1 text-xs mt-1 ${w.trend === 'up' ? 'text-rose-400' : 'text-emerald-400'}`}>
                {w.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {w.reason}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, desc, positive }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-slate-300 capitalize">{label}</p>
        <p className="text-[10px] text-slate-500">{desc}</p>
      </div>
      <p className={`font-medium whitespace-nowrap ${value.startsWith('-') ? 'text-emerald-400' : 'text-slate-200'}`}>{value}</p>
    </div>
  );
}
