import React, { useMemo } from 'react';
import { CheckCircle2, CloudLightning, Activity, Shield, TrendingUp, Wallet, Zap, Clock } from 'lucide-react';
import { RIDERS } from '../data/mockRiders.js';
import { ZONES, getZoneById } from '../data/zones.js';
import { calculatePremium } from '../engine/premiumEngine.js';
import { getCurrentWeather } from '../data/mockWeatherAPI.js';
import { evaluateTriggers } from '../engine/triggerEngine.js';
import StatusBadge from '../components/StatusBadge.jsx';
import RiskGauge from '../components/RiskGauge.jsx';

export default function Dashboard() {
  const rider = RIDERS[0]; // Rahul Kumar
  const zone = getZoneById(rider.zoneId);
  const premium = useMemo(() => calculatePremium(rider, zone), []);
  const weather = useMemo(() => getCurrentWeather(rider.zoneId), []);
  const triggers = useMemo(() => evaluateTriggers(rider, zone), []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-slate-400 text-sm">Welcome back,</p>
          <h1 className="text-2xl font-bold text-white">{rider.name}</h1>
          <p className="text-xs text-slate-500 mt-1">{rider.platform} · {zone.name} · Trust: {rider.trustScore}/100</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Protected
          </div>
        </div>
      </div>

      {/* Active Protection Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 shadow-2xl shadow-indigo-500/15 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute right-8 top-8 w-20 h-20 bg-white/5 rounded-full blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-indigo-200" />
            <p className="text-indigo-100 font-medium text-sm">Active Protection — {premium.plan.name}</p>
          </div>
          <h2 className="text-4xl font-bold text-white mb-1">₹{premium.coverageLimit} <span className="text-lg font-normal text-indigo-200">/ week limit</span></h2>
          <p className="text-indigo-200 text-sm mb-4">Max ₹{premium.plan.maxPayoutPerIncident} per incident</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-indigo-50 bg-white/10 px-3 py-1.5 rounded-lg"><CheckCircle2 className="w-4 h-4" /> Premium Paid</span>
            <span className="flex items-center gap-1.5 text-white font-semibold bg-white/15 px-3 py-1.5 rounded-lg backdrop-blur"><Wallet className="w-4 h-4" /> ₹{premium.finalPremium}/week</span>
            <span className="flex items-center gap-1.5 text-indigo-50 bg-white/10 px-3 py-1.5 rounded-lg"><Zap className="w-4 h-4" /> {premium.plan.coveredTriggers.length} triggers active</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4">
          <RiskGauge score={premium.compositeRisk.composite} size={100} label="Zone Risk" />
        </div>
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4 flex flex-col justify-center">
          <p className="text-slate-400 text-xs mb-1">Trust Score</p>
          <p className="text-3xl font-bold text-white">{rider.trustScore}</p>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
            <div className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${rider.trustScore}%` }} />
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4 flex flex-col justify-center">
          <p className="text-slate-400 text-xs mb-1">Weekly Earnings</p>
          <p className="text-3xl font-bold text-white">₹{rider.avgEarningsPerWeek.toLocaleString()}</p>
          <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1"><TrendingUp className="w-3 h-3" /> +8.2% this week</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4 flex flex-col justify-center">
          <p className="text-slate-400 text-xs mb-1">Claims This Month</p>
          <p className="text-3xl font-bold text-white">{rider.claimHistory.length}</p>
          <p className="text-xs text-slate-400 mt-1">₹{rider.claimHistory.reduce((s, c) => s + c.amount, 0)} recovered</p>
        </div>
      </div>

      {/* Live Alerts + Triggers */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weather & Alerts */}
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2"><CloudLightning className="w-4 h-4 text-amber-400" /> Live Conditions</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-xs text-slate-400">Temperature</p>
              <p className="text-xl font-bold text-white">{weather.temperature}°C</p>
              <p className="text-[10px] text-slate-500">Feels {weather.feelsLike}°C</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-xs text-slate-400">Rainfall</p>
              <p className="text-xl font-bold text-white">{weather.precipitation}mm</p>
              <p className="text-[10px] text-slate-500">Humidity {weather.humidity}%</p>
            </div>
          </div>
          {weather.alerts?.length > 0 && (
            <div className="space-y-2">
              {weather.alerts.map((a, i) => (
                <div key={i} className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 text-xs text-rose-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" /> {a.message}
                </div>
              ))}
            </div>
          )}
          {(!weather.alerts || weather.alerts.length === 0) && (
            <p className="text-xs text-emerald-400/70 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> No active weather alerts</p>
          )}
        </div>

        {/* Active Triggers */}
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-cyan-400" /> Protection Triggers</h3>
          <div className="space-y-2.5">
            {triggers.triggers.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{t.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    <p className="text-[10px] text-slate-500">{t.confidence}% confidence</p>
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Payouts */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> Recent Claims & Payouts</h3>
        <div className="space-y-3">
          {rider.claimHistory.map(c => (
            <div key={c.id} className="flex items-center justify-between bg-slate-800/30 rounded-xl px-4 py-3 border border-slate-800/30">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${c.type === 'waterlogging' ? 'bg-amber-500/15' : c.type === 'upi_outage' ? 'bg-indigo-500/15' : 'bg-cyan-500/15'}`}>
                  {c.type === 'waterlogging' ? '🌧️' : c.type === 'upi_outage' ? '💳' : c.type === 'heatwave' ? '🔥' : c.type === 'rwa_ban' ? '🏢' : '🚧'}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{c.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                  <p className="text-xs text-slate-500">{c.date} · {c.time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-emerald-400">+₹{c.amount}</p>
                <StatusBadge status={c.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
