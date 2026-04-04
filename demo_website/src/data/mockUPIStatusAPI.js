/**
 * Simulated UPI / Payment Gateway Status API
 * Monitors health of digital payment infrastructure.
 */

const UPI_PROVIDERS = [
  { id: 'phonepe', name: 'PhonePe', marketShare: 0.48 },
  { id: 'gpay', name: 'Google Pay', marketShare: 0.35 },
  { id: 'paytm', name: 'Paytm', marketShare: 0.10 },
  { id: 'bhim', name: 'BHIM UPI', marketShare: 0.05 },
  { id: 'cred', name: 'CRED', marketShare: 0.02 },
];

// Simulated outage windows (time ranges when outages occur)
const OUTAGE_SCENARIOS = [
  {
    id: 'OUT-001',
    provider: 'phonepe',
    startHour: 20, startMin: 0,
    endHour: 20, endMin: 45,
    dayOfWeek: 3, // Wednesday
    severity: 'major',
    affectedTransactions: 2400,
    errorType: 'BANK_SERVER_DOWN',
    bankAffected: 'ICICI Bank',
    status: 'resolved',
    resolution: 'Bank server restarted after memory overflow'
  },
  {
    id: 'OUT-002',
    provider: 'gpay',
    startHour: 19, startMin: 30,
    endHour: 20, endMin: 15,
    dayOfWeek: 4, // Thursday
    severity: 'critical',
    affectedTransactions: 5800,
    errorType: 'NPCI_SWITCH_FAILURE',
    bankAffected: 'Multiple Banks',
    status: 'active',
    resolution: null
  },
  {
    id: 'OUT-003',
    provider: 'paytm',
    startHour: 13, startMin: 15,
    endHour: 13, endMin: 50,
    dayOfWeek: 2, // Tuesday
    severity: 'minor',
    affectedTransactions: 450,
    errorType: 'GATEWAY_TIMEOUT',
    bankAffected: 'Paytm Payments Bank',
    status: 'resolved',
    resolution: 'Load balancer reconfigured'
  }
];

export function getUPIStatus() {
  return UPI_PROVIDERS.map(provider => {
    const outages = OUTAGE_SCENARIOS.filter(o => o.provider === provider.id);
    const activeOutage = outages.find(o => o.status === 'active');
    return {
      ...provider,
      status: activeOutage ? 'degraded' : 'operational',
      uptime: activeOutage ? 97.2 : 99.95 + Math.random() * 0.04,
      latency: activeOutage ? 2800 + Math.random() * 2000 : 120 + Math.random() * 80,
      successRate: activeOutage ? 0.62 + Math.random() * 0.15 : 0.985 + Math.random() * 0.01,
      activeOutage: activeOutage || null,
      recentOutages: outages.filter(o => o.status === 'resolved').length,
      lastOutageHoursAgo: outages.length > 0 ? Math.round(Math.random() * 72) : null
    };
  });
}

export function getUPIRiskScore() {
  const statuses = getUPIStatus();
  const degradedProviders = statuses.filter(s => s.status === 'degraded');
  const avgSuccessRate = statuses.reduce((s, p) => s + p.successRate * p.marketShare, 0);
  const outageRisk = degradedProviders.reduce((s, p) => s + p.marketShare * 100, 0);

  return {
    overallHealth: degradedProviders.length === 0 ? 'healthy' : degradedProviders.length === 1 ? 'degraded' : 'critical',
    avgSuccessRate: Math.round(avgSuccessRate * 1000) / 10,
    outageRiskPercent: Math.round(outageRisk * 10) / 10,
    degradedProviders: degradedProviders.map(p => p.name),
    riskScore: Math.round(outageRisk * 2 + (1 - avgSuccessRate) * 500)
  };
}

export function isUPIOutageActive() {
  return OUTAGE_SCENARIOS.some(o => o.status === 'active');
}

export function getActiveOutages() {
  return OUTAGE_SCENARIOS.filter(o => o.status === 'active').map(o => ({
    ...o,
    providerName: UPI_PROVIDERS.find(p => p.id === o.provider)?.name
  }));
}
