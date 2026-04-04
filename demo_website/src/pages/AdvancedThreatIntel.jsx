import React, { useMemo, useState } from 'react';
import { Brain, Network, Shield, Fingerprint, Link2, Users, Swords, Binary, GitBranch, Globe, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Eye, Zap, Lock, Cpu } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import { RIDERS } from '../data/mockRiders.js';
import { ZONES } from '../data/zones.js';
import { runGNNFraudDetection } from '../engine/gnnFraudEngine.js';
import { forecastFraudIntent, analyzeCausalFactors, runAdversarialSimulation, computeGameTheoreticModel, analyzeBehavioralBiometrics, generateDecentralizedIdentity, simulateFederatedLearning, getCrossPlatformIntelligence } from '../engine/advancedFraudSystems.js';
import StatusBadge from '../components/StatusBadge.jsx';

const TABS = [
  { id: 'gnn', label: 'GNN Detection', icon: Network, color: 'text-violet-400' },
  { id: 'intent', label: 'Intent Forecast', icon: Brain, color: 'text-cyan-400' },
  { id: 'causal', label: 'Causal AI', icon: GitBranch, color: 'text-amber-400' },
  { id: 'adversarial', label: 'Adversarial Defense', icon: Swords, color: 'text-rose-400' },
  { id: 'gametheory', label: 'Game Theory', icon: Binary, color: 'text-emerald-400' },
  { id: 'biometrics', label: 'Biometrics', icon: Fingerprint, color: 'text-indigo-400' },
  { id: 'blockchain', label: 'Blockchain DID', icon: Link2, color: 'text-orange-400' },
  { id: 'federated', label: 'Federated Learning', icon: Globe, color: 'text-teal-400' },
];

export default function AdvancedThreatIntel() {
  const [activeTab, setActiveTab] = useState('gnn');
  const [selectedRiderId, setSelectedRiderId] = useState(RIDERS[0].id);
  const selectedRider = RIDERS.find(r => r.id === selectedRiderId) || RIDERS[0];

  // Memoized computations
  const gnnResult = useMemo(() => runGNNFraudDetection(), []);
  const intentResult = useMemo(() => forecastFraudIntent(selectedRider), [selectedRiderId]);
  const causalResult = useMemo(() => analyzeCausalFactors(selectedRider), [selectedRiderId]);
  const adversarialResult = useMemo(() => runAdversarialSimulation(), []);
  const gameResult = useMemo(() => computeGameTheoreticModel(), []);
  const biometricsResult = useMemo(() => analyzeBehavioralBiometrics(selectedRider), [selectedRiderId]);
  const didResult = useMemo(() => generateDecentralizedIdentity(selectedRider), [selectedRiderId]);
  const federatedResult = useMemo(() => simulateFederatedLearning(), []);
  const crossPlatformResult = useMemo(() => getCrossPlatformIntelligence(), []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Shield className="w-6 h-6 text-violet-400" /> Advanced Threat Intelligence
        </h1>
        <p className="text-slate-400 text-sm">10 cutting-edge AI/ML systems for comprehensive fraud defense</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${activeTab === tab.id ? 'bg-slate-800 text-white border-slate-600' : 'bg-slate-900/50 text-slate-500 border-slate-800/50 hover:text-slate-300 hover:border-slate-700'}`}>
            <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? tab.color : ''}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Rider Selector */}
      {['intent', 'causal', 'biometrics', 'blockchain'].includes(activeTab) && (
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-500">Analyze Rider:</label>
          <select value={selectedRiderId} onChange={e => setSelectedRiderId(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white">
            {RIDERS.map(r => <option key={r.id} value={r.id}>{r.name} (Trust: {r.trustScore})</option>)}
          </select>
        </div>
      )}

      {/* ======================== GNN TAB ======================== */}
      {activeTab === 'gnn' && <GNNTab data={gnnResult} />}

      {/* ======================== INTENT FORECASTING TAB ======================== */}
      {activeTab === 'intent' && <IntentTab data={intentResult} rider={selectedRider} />}

      {/* ======================== CAUSAL AI TAB ======================== */}
      {activeTab === 'causal' && <CausalTab data={causalResult} />}

      {/* ======================== ADVERSARIAL TAB ======================== */}
      {activeTab === 'adversarial' && <AdversarialTab data={adversarialResult} />}

      {/* ======================== GAME THEORY TAB ======================== */}
      {activeTab === 'gametheory' && <GameTheoryTab data={gameResult} />}

      {/* ======================== BIOMETRICS TAB ======================== */}
      {activeTab === 'biometrics' && <BiometricsTab data={biometricsResult} />}

      {/* ======================== BLOCKCHAIN DID TAB ======================== */}
      {activeTab === 'blockchain' && <BlockchainTab data={didResult} rider={selectedRider} />}

      {/* ======================== FEDERATED LEARNING TAB ======================== */}
      {activeTab === 'federated' && <FederatedTab data={federatedResult} crossPlatform={crossPlatformResult} />}
    </div>
  );
}

// ======================== GNN TAB COMPONENT ========================
function GNNTab({ data }) {
  const anomalyChart = data.anomalies.map(a => ({ name: a.label.split(' ')[0], score: a.anomalyScore, distance: Math.round(a.distanceFromCentroid * 100), edges: a.suspiciousEdgeCount }));
  return (
    <div className="space-y-6">
      {/* Architecture Info */}
      <div className="bg-gradient-to-br from-violet-600/10 to-indigo-600/5 border border-violet-500/20 rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-3"><Network className="w-5 h-5 text-violet-400" /> GraphSAGE-Inspired Heterogeneous GNN</h3>
        <p className="text-xs text-slate-400 mb-4">Based on NASA EOSDIS-GNN architecture (GraphSAGE, 3-layer message passing, MEAN aggregation, ReLU activation)</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Nodes" value={data.stats.nodeCount} color="text-violet-400" />
          <StatCard label="Total Edges" value={data.stats.edgeCount} color="text-indigo-400" />
          <StatCard label="Anomalies Found" value={data.stats.anomaliesDetected} color="text-rose-400" />
          <StatCard label="Communities" value={data.stats.communitiesDetected} color="text-amber-400" />
        </div>
      </div>

      {/* Node & Edge Type Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Node Types</h4>
          <div className="space-y-2">
            {Object.entries(data.stats.nodeTypes).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                <span className="text-xs text-slate-400 capitalize">{type}</span>
                <span className="text-sm font-bold text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Edge Types</h4>
          <div className="space-y-2">
            {Object.entries(data.stats.edgeTypes).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                <span className="text-xs text-slate-400">{type.replace(/_/g, ' ')}</span>
                <span className={`text-sm font-bold ${type === 'CO_TEMPORAL' || type === 'SIMILAR_PATTERN' ? 'text-rose-400' : 'text-white'}`}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Anomaly Chart */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">GNN Anomaly Scores — Per Rider (Post Message Passing)</h4>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={anomalyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
              <Bar dataKey="score" name="Anomaly Score" radius={[4, 4, 0, 0]}>
                {anomalyChart.map((e, i) => <Cell key={i} fill={e.score > 60 ? '#ef4444' : e.score > 40 ? '#f97316' : e.score > 20 ? '#eab308' : '#22c55e'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Anomaly List */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Rider Anomaly Detail</h4>
        <div className="space-y-2">
          {data.anomalies.map(a => (
            <div key={a.nodeId} className="flex items-center justify-between bg-slate-800/30 rounded-xl px-4 py-3 border border-slate-700/30">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${a.riskLevel === 'critical' ? 'bg-rose-500/15 text-rose-400' : a.riskLevel === 'high' ? 'bg-orange-500/15 text-orange-400' : a.riskLevel === 'elevated' ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}`}>{a.anomalyScore}</div>
                <div>
                  <p className="text-sm font-medium text-white">{a.label}</p>
                  <p className="text-[10px] text-slate-500">Dist: {a.distanceFromCentroid} · Susp. Edges: {a.suspiciousEdgeCount} · Neighbors: {a.neighborhoodInfo.totalNeighbors}</p>
                </div>
              </div>
              <StatusBadge status={a.riskLevel} />
            </div>
          ))}
        </div>
      </div>

      {/* Communities */}
      {data.communities.length > 0 && (
        <div className="bg-rose-500/5 border border-rose-500/15 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-rose-300 uppercase tracking-wider mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> GNN-Detected Fraud Communities</h4>
          {data.communities.map(c => (
            <div key={c.id} className="bg-slate-800/50 rounded-xl p-4 mb-2 border border-rose-500/10">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-semibold text-white">{c.id}</span>
                <StatusBadge status={c.riskLevel} />
              </div>
              <p className="text-xs text-slate-400">{c.size} riders · {c.internalEdges} internal edges · Avg Trust: {c.avgTrustScore}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {c.members.map(m => <span key={m.nodeId} className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300">{m.label} ({m.trustScore})</span>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message Passing Visualization */}
      <div className="bg-slate-900/50 border border-violet-500/15 rounded-2xl p-5">
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2"><Cpu className="w-4 h-4 text-violet-400" /> Message Passing Architecture</h4>
        <div className="flex items-center justify-center gap-4 py-4 overflow-x-auto">
          {['Input Features', 'Layer 1\nSAGE Agg', 'Layer 2\nSAGE Agg', 'Layer 3\nSAGE Agg', 'Anomaly\nScoring'].map((step, i) => (
            <React.Fragment key={i}>
              <div className="flex-shrink-0 bg-slate-800/80 border border-violet-500/20 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-violet-300 font-medium whitespace-pre-line">{step}</p>
                <p className="text-[9px] text-slate-500 mt-1">{i === 0 ? '8-dim vectors' : i < 4 ? 'MEAN + ReLU + L2' : 'Centroid dist.'}</p>
              </div>
              {i < 4 && <span className="text-violet-500 text-lg flex-shrink-0">→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// ======================== INTENT FORECASTING TAB ========================
function IntentTab({ data, rider }) {
  const stateChart = data.stateHistory.map(s => ({
    step: `Step ${s.step}`,
    risk: s.risk,
    frequency: Math.round((s.hidden[0] || 0) * 100),
    amount: Math.round((s.hidden[1] || 0) * 100),
    pattern: Math.round((s.hidden[2] || 0) * 100),
    escalation: Math.round((s.hidden[3] || 0) * 100),
  }));

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-cyan-600/10 to-blue-600/5 border border-cyan-500/20 rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-3"><Brain className="w-5 h-5 text-cyan-400" /> LSTM Intent Prediction — {rider.name}</h3>
        <p className="text-xs text-slate-400 mb-4">Predicting fraudulent intent by analyzing the temporal sequence of behavioral signals. Uses 4-dimensional hidden state with forget/input/output gates.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Intent Score" value={`${data.intentScore}/100`} color={data.intentScore > 60 ? 'text-rose-400' : data.intentScore > 35 ? 'text-amber-400' : 'text-emerald-400'} />
          <StatCard label="Prediction" value={data.prediction.replace(/_/g, ' ')} color="text-white" />
          <StatCard label="Confidence" value={`${data.confidence}%`} color="text-cyan-400" />
          <StatCard label="Sequence Length" value={data.sequence.length} color="text-slate-300" />
        </div>
      </div>

      {/* Hidden State Evolution */}
      {stateChart.length > 1 && (
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">LSTM Hidden State Evolution Over Time</h4>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stateChart}>
                <defs>
                  <linearGradient id="freqGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                  <linearGradient id="amtGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient>
                  <linearGradient id="patGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
                  <linearGradient id="escGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/><stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="step" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
                <Legend />
                <Area type="monotone" dataKey="frequency" stroke="#ef4444" fill="url(#freqGrad)" strokeWidth={2} name="Freq Memory" />
                <Area type="monotone" dataKey="amount" stroke="#f97316" fill="url(#amtGrad)" strokeWidth={2} name="Amt Memory" />
                <Area type="monotone" dataKey="pattern" stroke="#8b5cf6" fill="url(#patGrad)" strokeWidth={2} name="Pattern Memory" />
                <Area type="monotone" dataKey="escalation" stroke="#06b6d4" fill="url(#escGrad)" strokeWidth={2} name="Escalation" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Final Hidden State */}
      <div className="grid md:grid-cols-4 gap-3">
        {Object.entries(data.modelDetails.dimensions).map(([dim, val]) => (
          <div key={dim} className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{dim} Memory</p>
            <p className={`text-2xl font-bold ${val > 0.5 ? 'text-rose-400' : val > 0.25 ? 'text-amber-400' : 'text-emerald-400'}`}>{Math.round(val * 100)}%</p>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
              <div className={`h-1.5 rounded-full ${val > 0.5 ? 'bg-rose-500' : val > 0.25 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, val * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((a, i) => (
            <div key={i} className={`flex items-center gap-2 text-xs px-3 py-2.5 rounded-lg ${a.severity === 'critical' ? 'bg-rose-500/10 text-rose-300 border border-rose-500/15' : a.severity === 'high' ? 'bg-orange-500/10 text-orange-300 border border-orange-500/15' : 'bg-amber-500/10 text-amber-300 border border-amber-500/15'}`}>
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {a.signal}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ======================== CAUSAL AI TAB ========================
function CausalTab({ data }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-amber-600/10 to-orange-600/5 border border-amber-500/20 rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-2"><GitBranch className="w-5 h-5 text-amber-400" /> Causal AI — {data.riderName}</h3>
        <p className="text-xs text-slate-400 mb-4">Structural Causal Model identifying <span className="text-amber-400 font-semibold">why</span> fraud happens, not just correlations</p>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total Causal Risk" value={`${data.totalCausalRisk}/100`} color={data.totalCausalRisk > 50 ? 'text-rose-400' : 'text-emerald-400'} />
          <StatCard label="Root Cause" value={data.rootCause} color="text-amber-400" />
          <StatCard label="Contributory Paths" value={data.contributoryPaths.length} color="text-white" />
        </div>
      </div>

      {/* Causal Paths */}
      {data.causalPaths.map((cp, i) => (
        <div key={i} className={`rounded-2xl p-5 border ${cp.isContributory ? 'bg-rose-500/5 border-rose-500/15' : 'bg-slate-900/50 border-slate-800/50'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white">{cp.path}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${cp.isContributory ? 'bg-rose-500/15 text-rose-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
              {cp.isContributory ? `Causal Effect: +${Math.round(cp.causalEffect)}` : 'Not Contributing'}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
            {cp.nodes.map((n, j) => (
              <React.Fragment key={j}>
                <span className={`text-xs px-2.5 py-1.5 rounded-lg flex-shrink-0 ${cp.isContributory ? 'bg-rose-500/10 text-rose-300 border border-rose-500/15' : 'bg-slate-800/50 text-slate-400 border border-slate-700/50'}`}>{n}</span>
                {j < cp.nodes.length - 1 && <span className="text-slate-600 flex-shrink-0">→</span>}
              </React.Fragment>
            ))}
          </div>
          <p className="text-xs text-slate-400 mb-2">{cp.evidence}</p>
          <p className="text-[10px] text-slate-500">Causal strength: {Math.round(cp.strength * 100)}% · Intervention: {cp.intervention}</p>
        </div>
      ))}

      {/* Counterfactual */}
      <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-2xl p-5">
        <h4 className="text-sm font-semibold text-indigo-300 mb-2">🔮 Counterfactual Analysis</h4>
        <p className="text-xs text-slate-400">"{data.counterfactual.question}"</p>
        <div className="flex items-center gap-4 mt-3">
          <div className="text-center"><p className="text-lg font-bold text-rose-400">{data.counterfactual.currentFraudRisk}</p><p className="text-[9px] text-slate-500">Current Risk</p></div>
          <span className="text-slate-500">→</span>
          <div className="text-center"><p className="text-lg font-bold text-emerald-400">{data.counterfactual.hypotheticalFraudRisk}</p><p className="text-[9px] text-slate-500">Hypothetical</p></div>
          <p className="text-xs text-indigo-300 ml-2">{data.counterfactual.reduction}</p>
        </div>
      </div>
    </div>
  );
}

// ======================== ADVERSARIAL TAB ========================
function AdversarialTab({ data }) {
  const chartData = data.rounds.map(r => ({ name: r.name.replace(/\s/g, '\n'), generator: r.generatorStrength * 100, detector: r.detectorAccuracy * 100 }));
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-rose-600/10 to-pink-600/5 border border-rose-500/20 rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-2"><Swords className="w-5 h-5 text-rose-400" /> GAN-Inspired Adversarial Defense</h3>
        <p className="text-xs text-slate-400 mb-4">Fraud Generator vs Fraud Detector — testing system robustness against {data.totalRounds} known attack vectors</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Robustness" value={`${data.overallRobustness}%`} color={data.overallRobustness > 70 ? 'text-emerald-400' : 'text-rose-400'} />
          <StatCard label="Defended" value={data.defended} color="text-emerald-400" />
          <StatCard label="Breached" value={data.breached} color="text-rose-400" />
          <StatCard label="Gen. Strength" value={`${data.ganMetrics.generatorAvgStrength}%`} color="text-amber-400" />
        </div>
      </div>

      {/* GAN Chart */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Generator vs Detector — Per Attack Vector</h4>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} interval={0} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
              <Legend />
              <Bar dataKey="generator" name="🗡️ Generator" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="detector" name="🛡️ Detector" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Results */}
      <div className="grid md:grid-cols-2 gap-3">
        {data.rounds.map(r => (
          <div key={r.round} className={`rounded-xl p-4 border ${r.outcome === 'DEFENDED' ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-rose-500/5 border-rose-500/15'}`}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-semibold text-white">{r.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${r.outcome === 'DEFENDED' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>{r.outcome}</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">{r.description}</p>
            <div className="flex gap-4 text-[10px] text-slate-500">
              <span>Gen: {Math.round(r.generatorStrength * 100)}%</span>
              <span>Det: {Math.round(r.detectorAccuracy * 100)}%</span>
              <span>Margin: {r.margin > 0 ? '+' : ''}{r.margin}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ======================== GAME THEORY TAB ========================
function GameTheoryTab({ data }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-emerald-600/10 to-teal-600/5 border border-emerald-500/20 rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-2"><Binary className="w-5 h-5 text-emerald-400" /> Economic Game-Theoretic Model</h3>
        <p className="text-xs text-slate-400 mb-4">Stackelberg game: Platform (leader) vs Fraudsters (followers). Finding Nash Equilibrium for optimal defense.</p>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-1">🎯 Nash Equilibrium</p>
          <p className="text-sm text-white mb-1">Platform: <span className="text-emerald-400 font-semibold">{data.nashEquilibrium.platformStrategy}</span> vs Fraudster: <span className="text-rose-400 font-semibold">{data.nashEquilibrium.fraudsterResponse}</span></p>
          <p className="text-xs text-slate-400">Catch Rate: {data.nashEquilibrium.catchRate}% · Platform Payoff: ₹{data.nashEquilibrium.platformPayoff} · Fraudster Payoff: ₹{data.nashEquilibrium.fraudsterPayoff}</p>
        </div>
      </div>

      {/* Payoff Matrix */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5 overflow-x-auto">
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Payoff Matrix (Platform Payoff / Fraudster Payoff)</h4>
        <table className="w-full text-xs">
          <thead>
            <tr><th className="text-left text-slate-500 pb-2 px-2">Platform ↓ / Fraud →</th>
              {data.platformStrategies[0].outcomes.map(o => <th key={o.fraudStrategy} className="text-center text-slate-400 pb-2 px-2">{o.fraudStrategy}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.platformStrategies.map(ps => (
              <tr key={ps.strategy} className="border-t border-slate-800/50">
                <td className="py-2 px-2 text-slate-300 font-medium">{ps.strategy} (₹{ps.cost})</td>
                {ps.outcomes.map((o, i) => (
                  <td key={i} className={`py-2 px-2 text-center ${o.isNashEquilibrium ? 'bg-emerald-500/10 rounded-lg border border-emerald-500/20' : ''}`}>
                    <span className={o.platformPayoff >= 0 ? 'text-emerald-400' : 'text-rose-400'}>₹{o.platformPayoff}</span>
                    <span className="text-slate-600"> / </span>
                    <span className={o.fraudsterPayoff >= 0 ? 'text-rose-400' : 'text-emerald-400'}>₹{o.fraudsterPayoff}</span>
                    {o.isNashEquilibrium && <span className="block text-[8px] text-emerald-400 mt-0.5">★ NASH</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-800/50 rounded-xl p-4 text-xs text-slate-400">{data.recommendation}</div>
    </div>
  );
}

// ======================== BIOMETRICS TAB ========================
function BiometricsTab({ data }) {
  const radarData = Object.entries(data.deviations).map(([key, val]) => ({ metric: key.replace(/([A-Z])/g, ' $1').trim(), deviation: Math.round(val * 100), baseline: 100 }));
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-600/10 to-purple-600/5 border border-indigo-500/20 rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-2"><Fingerprint className="w-5 h-5 text-indigo-400" /> Behavioral Biometrics — {data.riderName}</h3>
        <p className="text-xs text-slate-400 mb-4">Continuously verifying identity via interaction patterns. Frictionless, invisible security.</p>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Identity Confidence" value={`${data.identityConfidence}%`} color={data.identityConfidence > 85 ? 'text-emerald-400' : data.identityConfidence > 60 ? 'text-amber-400' : 'text-rose-400'} />
          <StatCard label="Verdict" value={data.verdict.replace(/_/g, ' ')} color="text-white" />
          <StatCard label="Action" value={data.isAccountTakeover ? 'BLOCK' : 'PASS'} color={data.isAccountTakeover ? 'text-rose-400' : 'text-emerald-400'} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Deviation Radar</h4>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="metric" stroke="#94a3b8" fontSize={9} />
                <PolarRadiusAxis domain={[0, 100]} stroke="#475569" fontSize={9} />
                <Radar name="Deviation %" dataKey="deviation" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Biometric Signals</h4>
          <div className="space-y-3">
            {Object.entries(data.baseline).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">Base: {typeof val === 'number' ? Math.round(val * 100) / 100 : val}</span>
                  <span className="text-white font-medium">Now: {typeof data.currentSession[key] === 'number' ? Math.round(data.currentSession[key] * 100) / 100 : '—'}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-4 border-t border-slate-700/50 pt-3">{data.authentication}</p>
        </div>
      </div>
    </div>
  );
}

// ======================== BLOCKCHAIN TAB ========================
function BlockchainTab({ data, rider }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-orange-600/10 to-amber-600/5 border border-orange-500/20 rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-2"><Link2 className="w-5 h-5 text-orange-400" /> Blockchain Decentralized Identity (DID)</h3>
        <p className="text-xs text-slate-400 mb-4">Tamper-proof digital identity for {rider.name}. Verifiable credentials on-chain. Portable trust across platforms.</p>
        <div className="bg-slate-800/50 rounded-xl p-4 font-mono text-sm text-orange-400 break-all">{data.did}</div>
      </div>

      {/* Credential Hash */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Identity Record</h4>
          <div className="space-y-3 text-xs">
            <Row2 label="DID" value={data.did} mono />
            <Row2 label="Subject" value={data.subject} />
            <Row2 label="Method" value={data.method} />
            <Row2 label="Credential Hash" value={data.credentialHash} mono />
            <Row2 label="Issued" value={new Date(data.issuedAt).toLocaleDateString()} />
            <Row2 label="Portable" value={data.crossPlatformPortability ? 'Yes ✓' : 'No'} />
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">🔗 Blockchain Record</h4>
          <div className="space-y-3 text-xs">
            <Row2 label="Chain" value={data.blockchainRecord.chain} />
            <Row2 label="Block" value={`#${data.blockchainRecord.block}`} />
            <Row2 label="TX Hash" value={data.blockchainRecord.txHash} mono />
            <Row2 label="Gas Used" value={data.blockchainRecord.gasUsed} />
          </div>
        </div>
      </div>

      {/* Verifiable Credentials */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Verifiable Credentials</h4>
        <div className="space-y-2">
          {data.verifiableCredentials.map((vc, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/30">
              <div>
                <p className="text-sm font-medium text-white">{vc.type}</p>
                <p className="text-[10px] text-slate-500 font-mono">{vc.hash}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Issuer: {vc.issuer}</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">{vc.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Anti-Duplicate */}
      <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-5">
        <h4 className="text-sm font-semibold text-emerald-300 mb-2 flex items-center gap-2"><Lock className="w-4 h-4" /> Anti-Duplicate Check</h4>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div><p className="text-slate-500">Phone Hash</p><p className="text-white font-mono text-[10px]">{data.antiDuplicateCheck.phoneHash}</p></div>
          <div><p className="text-slate-500">Biometric Hash</p><p className="text-white font-mono text-[10px]">{data.antiDuplicateCheck.biometricHash}</p></div>
          <div><p className="text-slate-500">Duplicate?</p><p className="text-emerald-400 font-semibold">{data.antiDuplicateCheck.isDuplicate ? 'DUPLICATE FOUND' : 'NO DUPLICATES ✓'}</p></div>
        </div>
      </div>
    </div>
  );
}

// ======================== FEDERATED LEARNING TAB ========================
function FederatedTab({ data, crossPlatform }) {
  const platformChart = data.localModels.map(m => ({ name: m.platform, local: Math.round(m.localAccuracy * 100), global: data.globalModel.accuracy, fraudRate: m.localFraudRate }));
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-teal-600/10 to-cyan-600/5 border border-teal-500/20 rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-2"><Globe className="w-5 h-5 text-teal-400" /> Federated Learning + Cross-Platform Intelligence</h3>
        <p className="text-xs text-slate-400 mb-4">Training fraud models across {data.localModels.length} platforms without sharing raw data. {data.privacyGuarantees.dataShared}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Global Accuracy" value={`${data.globalModel.accuracy}%`} color="text-emerald-400" />
          <StatCard label="Improvement" value={`+${data.globalModel.improvementOverLocal}%`} color="text-cyan-400" />
          <StatCard label="Total Data" value={data.globalModel.totalDataPoints.toLocaleString()} color="text-white" />
          <StatCard label="Convergence" value="18 rounds" color="text-teal-400" />
        </div>
      </div>

      {/* Platform Comparison */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Local vs Federated Accuracy</h4>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformChart} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={[50, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
              <Legend />
              <Bar dataKey="local" name="Local Model" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="global" name="Federated Model" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Platform Details */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.localModels.map(m => (
          <div key={m.platform} className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <p className="text-sm font-semibold text-white mb-2">{m.platform}</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Local Accuracy</span><span className="text-white">{Math.round(m.localAccuracy * 100)}%</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Data Samples</span><span className="text-white">{m.dataSamples.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Local Fraud Rate</span><span className="text-rose-400">{m.localFraudRate}%</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Privacy ε</span><span className="text-teal-400">{m.privacyBudget.epsilon}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Training Rounds</span><span className="text-white">{m.trainingRounds}</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Cross-Platform Intelligence */}
      <div className="bg-slate-900/50 border border-teal-500/15 rounded-2xl p-5">
        <h4 className="text-sm font-semibold text-teal-300 uppercase tracking-wider mb-3 flex items-center gap-2"><Zap className="w-4 h-4" /> {crossPlatform.networkName}</h4>
        <div className="space-y-2 mb-4">
          {crossPlatform.sharedSignals.map((s, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{s.type}</span>
                <span className="text-[9px] text-slate-600">{s.description}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-white">{s.count}</span>
                <span className="text-[9px] text-teal-400">{s.updateFrequency}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Repeat Offenders" value={crossPlatform.repeatOffenders.detected} color="text-rose-400" />
          <StatCard label="Blocked" value={crossPlatform.repeatOffenders.blocked} color="text-emerald-400" />
          <StatCard label="Cross-Platform Bans" value={crossPlatform.repeatOffenders.crossPlatformBans} color="text-amber-400" />
        </div>
      </div>

      {/* Privacy */}
      <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4">
        <p className="text-xs text-emerald-400 font-semibold mb-1 flex items-center gap-1"><Lock className="w-3 h-3" /> Privacy Guarantees</p>
        <p className="text-[11px] text-slate-400">{data.privacyGuarantees.method} · {data.privacyGuarantees.dataShared} · {data.privacyGuarantees.complianceNote}</p>
        <p className="text-[10px] text-slate-500 mt-1">Protocol: {crossPlatform.protocol.encryption} + {crossPlatform.protocol.hashing} over {crossPlatform.protocol.transport}</p>
      </div>
    </div>
  );
}

// ======================== HELPER COMPONENTS ========================
function StatCard({ label, value, color = 'text-white' }) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-3 text-center">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}

function Row2({ label, value, mono }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={`text-white ${mono ? 'font-mono text-[10px]' : ''}`}>{value}</span>
    </div>
  );
}
