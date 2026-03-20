import React, { useState } from 'react';
import { ShieldCheck, CloudLightning, Activity, MapPin, Wallet, Zap, ShieldAlert, Cpu, CheckCircle2, AlertTriangle, UserCheck } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockRiskData = [
  { day: 'Mon', risk: 12, premium: 15 },
  { day: 'Tue', risk: 15, premium: 18 },
  { day: 'Wed', risk: 45, premium: 30 },
  { day: 'Thu', risk: 80, premium: 50 }, // Severe weather alert
  { day: 'Fri', risk: 30, premium: 22 },
  { day: 'Sat', risk: 25, premium: 20 },
  { day: 'Sun', risk: 18, premium: 16 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('rider');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-8 pb-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-indigo-400" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">GigGuard</h1>
        </div>
        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setActiveTab('rider')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'rider' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Rider POV
          </button>
          <button
            onClick={() => setActiveTab('insurer')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'insurer' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Command Center
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto flex gap-6 justify-center">
        {activeTab === 'rider' && <RiderDashboard />}
        {activeTab === 'insurer' && <InsurerDashboard />}
      </main>
    </div>
  );
}

function RiderDashboard() {
  return (
    <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-600/40 to-transparent pointer-events-none" />
      
      <div className="p-6 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-slate-400 text-sm">Welcome back,</p>
            <h2 className="text-xl font-semibold text-white">Rahul K.</h2>
          </div>
          <div className="flex items-center gap-1 bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-semibold border border-green-500/20">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            Online
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-5 mb-6 shadow-lg shadow-indigo-500/20 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <p className="text-indigo-100 font-medium text-sm mb-1">Active Protection</p>
          <h3 className="text-3xl font-bold text-white mb-4">₹1,250 <span className="text-lg font-normal text-indigo-200">/ week limit</span></h3>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-indigo-50"><CheckCircle2 className="w-4 h-4" /> Weekly Premium Paid</span>
            <span className="font-semibold px-2 py-1 bg-white/20 rounded-md backdrop-blur-md">₹35.00</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
             <CloudLightning className="w-6 h-6 text-amber-400 mb-2" />
             <h4 className="font-semibold text-slate-200 text-sm">Weather Alert</h4>
             <p className="text-xs text-slate-400 mt-1">Severe Rain (>40mm)</p>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
             <Activity className="w-6 h-6 text-rose-400 mb-2" />
             <h4 className="font-semibold text-slate-200 text-sm">Network Status</h4>
             <p className="text-xs text-slate-400 mt-1">UPI Stable</p>
          </div>
        </div>

        <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Recent Payouts</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-800/80 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <CloudLightning className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Waterlogging Pause</p>
                  <p className="text-xs text-slate-400">Mar 18, 2:30 PM (45 mins)</p>
                </div>
              </div>
              <span className="text-green-400 font-semibold text-sm">+₹120</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/80 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">UPI Gateway Crash</p>
                  <p className="text-xs text-slate-400">Mar 15, 8:15 PM (22 mins)</p>
                </div>
              </div>
              <span className="text-green-400 font-semibold text-sm">+₹65</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsurerDashboard() {
  return (
    <div className="w-full flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col">
          <p className="text-sm text-slate-400 font-medium mb-1">Active Policies</p>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            12,450 <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">+4.2%</span>
          </h2>
        </div>
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col">
          <p className="text-sm text-slate-400 font-medium mb-1">Liquidity Pool</p>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            ₹1.2M <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full border border-green-400/20">Secure</span>
          </h2>
        </div>
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col">
          <p className="text-sm text-slate-400 font-medium mb-1">AI Fraud Flags Today</p>
          <h2 className="text-3xl font-bold text-rose-400 flex items-center gap-2">
            47 <span className="text-xs text-rose-400 bg-rose-400/10 px-2 py-1 rounded-full">Spoofing Attempt Blocked</span>
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/30 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-6">
            <Zap className="text-cyan-400 w-5 h-5" /> Dynamic Risk & Premium Forecasting
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockRiskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Line type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={3} dot={{r:4, fill: '#ef4444', strokeWidth: 2}} name="Risk Propensity" />
                <Line type="monotone" dataKey="premium" stroke="#3b82f6" strokeWidth={3} dot={{r:4, fill: '#3b82f6', strokeWidth: 2}} name="Suggested Base Premium (₹)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-slate-400 mt-4 text-center">AI anticipates severe weather on Thursday, increasing the weekly premium suggestion dynamically.</p>
        </div>

        <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-4">
            <ShieldAlert className="text-rose-400 w-5 h-5" /> Anti-Spoofing Feed
          </h3>
          <div className="flex-1 space-y-4 overflow-y-auto">
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-rose-400 w-4 h-4" />
                <span className="text-sm font-semibold text-rose-200">High Confidence Spoof</span>
              </div>
              <p className="text-xs text-rose-100/70 mb-2">Cluster ID: #AX-891 (45 accounts)</p>
              <div className="space-y-1 text-xs text-slate-400">
                <div className="flex justify-between"><span>GPS Position:</span> <span className="text-white">Flooded Zone (Sector 4)</span></div>
                <div className="flex justify-between"><span>Sensory Data:</span> <span className="text-rose-400 font-medium">Stationary (0.01m/s²)</span></div>
                <div className="flex justify-between"><span>Cell Tower:</span> <span className="text-rose-400 font-medium">Mismatched (Sector 9)</span></div>
              </div>
              <button className="mt-3 w-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                Block Syndicate Request
              </button>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="text-amber-400 w-4 h-4" />
                <span className="text-sm font-semibold text-amber-200">Anomaly Detected</span>
              </div>
              <p className="text-xs text-amber-100/70 mb-2">User: Rider #4010</p>
              <div className="space-y-1 text-xs text-slate-400">
                <div className="flex justify-between"><span>Claim Trigger:</span> <span className="text-white">RWA Ban Dwell-Time</span></div>
                <div className="flex justify-between"><span>Anomaly:</span> <span className="text-amber-400">No other riders delayed here</span></div>
              </div>
              <button className="mt-3 w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                Request Async Proof
              </button>
            </div>
            
             <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="text-emerald-400 w-4 h-4" />
                <span className="text-sm font-semibold text-emerald-200">Auto-Resolved</span>
              </div>
              <p className="text-xs text-emerald-100/70">Rider #8911 (High Trust Score) - Allowed Benefit of Doubt.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
