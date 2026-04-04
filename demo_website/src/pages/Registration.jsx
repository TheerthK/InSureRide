import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Clock, Shield, CheckCircle2, ChevronRight, ChevronLeft, Smartphone } from 'lucide-react';
import { ZONES, getZoneRiskScore } from '../data/zones.js';
import { POLICY_PLANS } from '../engine/premiumEngine.js';

const PLATFORMS = ['Zomato', 'Swiggy', 'Zepto', 'Blinkit', 'Dunzo', 'Other'];
const STEPS = [
  { id: 1, title: 'Personal Details', icon: User },
  { id: 2, title: 'Zone Selection', icon: MapPin },
  { id: 3, title: 'Work Schedule', icon: Clock },
  { id: 4, title: 'Choose Plan', icon: Shield },
  { id: 5, title: 'Confirmation', icon: CheckCircle2 },
];

export default function Registration() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', phone: '', platform: '', zoneId: '', workHoursStart: 9, workHoursEnd: 22, workDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], plan: 'standard' });
  const navigate = useNavigate();

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const canProceed = () => {
    if (step === 1) return form.name && form.phone && form.platform;
    if (step === 2) return form.zoneId;
    return true;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Rider Registration</h1>
        <p className="text-slate-400">Set up your income protection in under 2 minutes</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-shrink-0">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${step === s.id ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : step > s.id ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800/50 text-slate-500'}`}>
              {step > s.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{s.title}</span>
            </div>
            {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 lg:p-8">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><User className="w-5 h-5 text-indigo-400" /> Personal Details</h2>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Enter your full name" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone Number</label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-400">+91</span>
                  <input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="98765 43210" className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Delivery Platform</label>
                <div className="grid grid-cols-3 gap-2">
                  {PLATFORMS.map(p => (
                    <button key={p} onClick={() => update('platform', p)} className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${form.platform === p ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'}`}>{p}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><MapPin className="w-5 h-5 text-indigo-400" /> Select Your Primary Zone</h2>
            <p className="text-sm text-slate-400">Your premium is calculated based on hyper-local risk factors in your delivery zone.</p>
            <div className="grid gap-3">
              {ZONES.map(z => {
                const riskScore = getZoneRiskScore(z);
                const riskColor = riskScore > 30 ? 'text-rose-400' : riskScore > 15 ? 'text-amber-400' : 'text-emerald-400';
                const riskBg = riskScore > 30 ? 'bg-rose-500/10' : riskScore > 15 ? 'bg-amber-500/10' : 'bg-emerald-500/10';
                return (
                  <button key={z.id} onClick={() => update('zoneId', z.id)} className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left ${form.zoneId === z.id ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'}`}>
                    <div>
                      <p className="font-semibold text-white">{z.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{z.riderDensity} riders · {z.safetyClassification}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${riskColor}`}>{riskScore.toFixed(1)}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${riskBg} ${riskColor}`}>Risk Score</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-400" /> Work Schedule</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Working Hours</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">Start</span>
                    <select value={form.workHoursStart} onChange={e => update('workHoursStart', Number(e.target.value))} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm">
                      {Array.from({ length: 18 }, (_, i) => i + 5).map(h => <option key={h} value={h}>{h}:00</option>)}
                    </select>
                  </div>
                  <span className="text-slate-500">→</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">End</span>
                    <select value={form.workHoursEnd} onChange={e => update('workHoursEnd', Number(e.target.value))} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm">
                      {Array.from({ length: 18 }, (_, i) => i + 5).map(h => <option key={h} value={h}>{h}:00</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Working Days</label>
                <div className="flex flex-wrap gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                    <button key={d} onClick={() => update('workDays', form.workDays.includes(d) ? form.workDays.filter(x => x !== d) : [...form.workDays, d])} className={`w-12 h-12 rounded-xl text-sm font-semibold transition-all ${form.workDays.includes(d) ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800/50 text-slate-500 border border-slate-700'}`}>{d}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Shield className="w-5 h-5 text-indigo-400" /> Choose Your Plan</h2>
            <div className="grid gap-4">
              {Object.entries(POLICY_PLANS).map(([key, plan]) => (
                <button key={key} onClick={() => update('plan', key)} className={`p-5 rounded-2xl border text-left transition-all ${form.plan === key ? 'bg-indigo-500/10 border-indigo-500/30 shadow-lg shadow-indigo-500/5' : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-white text-lg">{plan.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">₹{Math.round(plan.premiumMultiplier * 35)}</p>
                      <p className="text-[10px] text-slate-500">approx/week</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.coveredTriggers.map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300">{t.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Coverage: ₹{plan.coverageLimit}/week · Max ₹{plan.maxPayoutPerIncident}/incident</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="text-center py-8 space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">You're Protected! 🎉</h2>
              <p className="text-slate-400">Welcome to GigGuard, {form.name || 'Rider'}.</p>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-6 max-w-sm mx-auto text-left space-y-3">
              <div className="flex justify-between text-sm"><span className="text-slate-400">Platform</span><span className="text-white font-medium">{form.platform}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Zone</span><span className="text-white font-medium">{ZONES.find(z => z.id === form.zoneId)?.name || '—'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Plan</span><span className="text-indigo-400 font-medium">{POLICY_PLANS[form.plan]?.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Coverage</span><span className="text-white font-medium">₹{POLICY_PLANS[form.plan]?.coverageLimit}/week</span></div>
            </div>
            <button onClick={() => navigate('/')} className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all">Go to Dashboard →</button>
          </div>
        )}

        {/* Navigation Buttons */}
        {step < 5 && (
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-800/50">
            <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20">
              {step === 4 ? 'Confirm & Activate' : 'Continue'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
