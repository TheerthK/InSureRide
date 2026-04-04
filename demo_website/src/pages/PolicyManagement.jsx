import React, { useState, useMemo } from 'react';
import { FileText, Shield, CheckCircle2, Clock, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { RIDERS } from '../data/mockRiders.js';
import { ZONES, getZoneById } from '../data/zones.js';
import { POLICY_PLANS, calculatePremium } from '../engine/premiumEngine.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function PolicyManagement() {
  const [selectedRider, setSelectedRider] = useState(RIDERS[0]);
  const [expandedPlan, setExpandedPlan] = useState(null);
  const zone = getZoneById(selectedRider.zoneId);
  const premium = useMemo(() => calculatePremium(selectedRider, zone), [selectedRider]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Policy Management</h1>
        <p className="text-slate-400 text-sm">View, compare, and manage your income protection policies</p>
      </div>

      {/* Active Policy Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Active Policy</h2>
            <StatusBadge status="active" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Policy ID</p>
              <p className="text-sm font-medium text-white">{selectedRider.policyId}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Plan</p>
              <p className="text-sm font-medium text-indigo-400">{premium.plan.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Weekly Premium</p>
              <p className="text-sm font-medium text-white">₹{premium.finalPremium}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Coverage Limit</p>
              <p className="text-sm font-medium text-white">₹{premium.coverageLimit}/week</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Covered Triggers</p>
            <div className="flex flex-wrap gap-2">
              {premium.plan.coveredTriggers.map(t => (
                <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {t.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Plan Comparison */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-slate-400" /> All Plans</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(POLICY_PLANS).map(([key, plan]) => {
            const isActive = selectedRider.policyPlan === key;
            const expanded = expandedPlan === key;
            return (
              <div key={key} className={`rounded-2xl border p-5 transition-all ${isActive ? 'bg-indigo-500/5 border-indigo-500/30 shadow-lg shadow-indigo-500/5' : 'bg-slate-900/30 border-slate-800/50'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-white">{plan.name}</h3>
                    {isActive && <span className="text-[10px] text-indigo-400 font-semibold">CURRENT PLAN</span>}
                  </div>
                  <p className="text-xl font-bold text-white">₹{Math.round(plan.premiumMultiplier * 35)}<span className="text-xs text-slate-500">/wk</span></p>
                </div>
                <p className="text-xs text-slate-400 mb-3">{plan.description}</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-500">Coverage</span><span className="text-white">₹{plan.coverageLimit}/week</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Max/incident</span><span className="text-white">₹{plan.maxPayoutPerIncident}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Triggers</span><span className="text-white">{plan.coveredTriggers.length}</span></div>
                </div>
                <button onClick={() => setExpandedPlan(expanded ? null : key)} className="mt-3 w-full flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-white transition-colors">
                  {expanded ? <><ChevronUp className="w-3 h-3" /> Less</> : <><ChevronDown className="w-3 h-3" /> Details</>}
                </button>
                {expanded && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-1.5">
                    {plan.coveredTriggers.map(t => (
                      <div key={t} className="flex items-center gap-2 text-xs">
                        <Zap className="w-3 h-3 text-indigo-400" />
                        <span className="text-slate-300">{t.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                )}
                {!isActive && <button className="mt-3 w-full py-2 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all">Switch to {plan.name}</button>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Policy History */}
      <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> Policy Timeline</h3>
        <div className="relative pl-6 space-y-4">
          <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-700" />
          {[
            { date: 'Apr 1, 2026', event: 'Premium renewed', detail: `₹${premium.finalPremium} paid for Week 14`, status: 'active' },
            { date: 'Mar 25, 2026', event: 'Premium renewed', detail: '₹40 paid for Week 13', status: 'active' },
            { date: 'Mar 18, 2026', event: 'Claim auto-approved', detail: 'Waterlogging pause — ₹120 paid', status: 'auto-approved' },
            { date: 'Mar 1, 2026', event: 'Plan upgraded', detail: 'Standard → Premium Fortress', status: 'active' },
            { date: `${selectedRider.joinedWeeksAgo} weeks ago`, event: 'Policy activated', detail: 'First registration completed', status: 'active' },
          ].map((item, i) => (
            <div key={i} className="relative flex gap-3">
              <div className="absolute -left-[18px] w-3 h-3 rounded-full bg-slate-800 border-2 border-indigo-500 mt-1.5" />
              <div>
                <p className="text-xs text-slate-500">{item.date}</p>
                <p className="text-sm font-medium text-white">{item.event}</p>
                <p className="text-xs text-slate-400">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
