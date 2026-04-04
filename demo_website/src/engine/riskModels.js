/**
 * RISK MODELS — Bayesian Risk Factor Scoring
 * 
 * Each risk dimension uses a Bayesian posterior update approach:
 * P(disruption | evidence) = P(evidence | disruption) × P(disruption) / P(evidence)
 * 
 * The models maintain prior probabilities from zone history
 * and update them with real-time API evidence.
 */

/**
 * Compute Bayesian posterior probability of disruption given evidence signals.
 * @param {number} prior - P(disruption) from zone history [0,1]
 * @param {number} likelihood - P(evidence | disruption) [0,1]
 * @param {number} evidenceBase - P(evidence) marginal probability [0,1]
 * @returns {number} Posterior probability [0,1]
 */
export function bayesianUpdate(prior, likelihood, evidenceBase) {
  if (evidenceBase === 0) return prior;
  const posterior = (likelihood * prior) / evidenceBase;
  return Math.min(1, Math.max(0, posterior));
}

/**
 * Multi-factor Bayesian risk aggregator.
 * Combines multiple evidence signals into a single disruption probability.
 * Uses log-odds for numerical stability with multiple updates.
 */
export function multiFactorBayesian(prior, evidenceArray) {
  // Convert to log-odds for stable sequential updates
  let logOdds = Math.log(prior / (1 - prior + 1e-10));

  for (const { likelihood, evidenceBase } of evidenceArray) {
    if (evidenceBase > 0 && likelihood > 0) {
      // Log-likelihood ratio
      const llr = Math.log(likelihood / evidenceBase);
      logOdds += llr;
    }
  }

  // Convert back to probability
  const posterior = 1 / (1 + Math.exp(-logOdds));
  return Math.min(0.99, Math.max(0.01, posterior));
}

/**
 * Compute waterlogging risk model.
 * Incorporates: zone drainage history, current rainfall, cumulative precipitation,
 * soil saturation proxy, and infrastructure quality.
 */
export function waterloggingRiskModel(zoneProfile, weatherData) {
  const prior = zoneProfile.waterlogging.frequency;
  
  const evidence = [];

  // Evidence 1: Current precipitation intensity
  if (weatherData.totalPrecipitation > 0) {
    const rainIntensity = Math.min(1, weatherData.totalPrecipitation / 100);
    evidence.push({
      likelihood: 0.3 + 0.7 * rainIntensity, // P(this much rain | waterlogging)
      evidenceBase: 0.15 + 0.3 * rainIntensity // P(this much rain in general)
    });
  }

  // Evidence 2: Zone drainage quality (inverse of historical frequency)
  const drainageQuality = 1 - prior;
  evidence.push({
    likelihood: 1 - drainageQuality * 0.5,
    evidenceBase: 0.5
  });

  // Evidence 3: Safe weeks streak (lower streak = higher recent risk)
  const streakFactor = Math.exp(-zoneProfile.waterlogging.safeWeeksStreak * 0.15);
  evidence.push({
    likelihood: 0.3 + 0.6 * streakFactor,
    evidenceBase: 0.4
  });

  const posterior = multiFactorBayesian(prior, evidence);
  
  return {
    probability: Math.round(posterior * 1000) / 10,
    severity: posterior > 0.7 ? 'critical' : posterior > 0.4 ? 'high' : posterior > 0.2 ? 'medium' : 'low',
    factors: {
      basePrior: Math.round(prior * 100),
      precipitationSignal: weatherData.totalPrecipitation,
      drainageQuality: Math.round(drainageQuality * 100),
      recentHistory: zoneProfile.waterlogging.safeWeeksStreak
    }
  };
}

/**
 * Compute heatwave risk model.
 * Uses temperature forecasts, urban heat island coefficient, and seasonal patterns.
 */
export function heatwaveRiskModel(zoneProfile, weatherData) {
  const prior = zoneProfile.heatwave.frequency;

  const evidence = [];

  // Evidence 1: Temperature forecast
  if (weatherData.maxFeelsLike) {
    const heatIntensity = Math.max(0, (weatherData.maxFeelsLike - 38)) / 12; // 38°C threshold
    evidence.push({
      likelihood: Math.min(0.95, 0.1 + 0.85 * heatIntensity),
      evidenceBase: 0.15
    });
  }

  // Evidence 2: Urban heat island (correlated with zone density)
  evidence.push({
    likelihood: 0.4 + 0.2 * (zoneProfile.heatwave.avgPeakTemp > 35 ? 1 : 0),
    evidenceBase: 0.45
  });

  const posterior = multiFactorBayesian(prior, evidence);

  return {
    probability: Math.round(posterior * 1000) / 10,
    severity: posterior > 0.6 ? 'critical' : posterior > 0.3 ? 'high' : posterior > 0.15 ? 'medium' : 'low',
    factors: {
      basePrior: Math.round(prior * 100),
      maxFeelsLike: weatherData.maxFeelsLike,
      urbanHeatIsland: zoneProfile.heatwave.avgPeakTemp
    }
  };
}

/**
 * Compute traffic paralysis risk model.
 * Considers peak hour congestion, civic events, and historical bottlenecks.
 */
export function trafficRiskModel(zoneProfile, trafficData) {
  const prior = zoneProfile.trafficParalysis.frequency;

  const evidence = [];

  // Evidence 1: Peak hour congestion
  const peakCongestion = trafficData.avgPeakCongestion / 100;
  evidence.push({
    likelihood: 0.2 + 0.7 * peakCongestion,
    evidenceBase: 0.35
  });

  // Evidence 2: Active/scheduled civic events
  const eventRisk = Math.min(1, trafficData.eventRisk / 2);
  if (eventRisk > 0) {
    evidence.push({
      likelihood: 0.3 + 0.65 * eventRisk,
      evidenceBase: 0.1
    });
  }

  // Evidence 3: VIP movement risk from zone profile
  evidence.push({
    likelihood: 0.2 + 0.5 * zoneProfile.trafficParalysis.vipMovementRisk,
    evidenceBase: 0.3
  });

  const posterior = multiFactorBayesian(prior, evidence);

  return {
    probability: Math.round(posterior * 1000) / 10,
    severity: posterior > 0.65 ? 'critical' : posterior > 0.4 ? 'high' : posterior > 0.2 ? 'medium' : 'low',
    factors: {
      basePrior: Math.round(prior * 100),
      peakCongestion: trafficData.avgPeakCongestion,
      eventRisk: trafficData.eventRisk,
      vipRisk: Math.round(zoneProfile.trafficParalysis.vipMovementRisk * 100)
    }
  };
}

/**
 * Compute UPI outage risk model.
 * Based on provider health signals and historical outage correlation.
 */
export function upiRiskModel(zoneProfile, upiData) {
  const prior = zoneProfile.upiOutage.frequency;

  const evidence = [];

  // Evidence 1: Active outage status
  if (upiData.overallHealth === 'critical') {
    evidence.push({ likelihood: 0.95, evidenceBase: 0.05 });
  } else if (upiData.overallHealth === 'degraded') {
    evidence.push({ likelihood: 0.7, evidenceBase: 0.12 });
  }

  // Evidence 2: Success rate degradation
  const failRate = (100 - upiData.avgSuccessRate) / 100;
  if (failRate > 0.01) {
    evidence.push({
      likelihood: 0.3 + 0.6 * Math.min(1, failRate * 10),
      evidenceBase: 0.15
    });
  }

  // Evidence 3: Peak hour correlation
  evidence.push({
    likelihood: 0.3 + 0.4 * zoneProfile.upiOutage.correlationWithPeakHours,
    evidenceBase: 0.4
  });

  const posterior = evidence.length > 0 ? multiFactorBayesian(prior, evidence) : prior;

  return {
    probability: Math.round(posterior * 1000) / 10,
    severity: posterior > 0.5 ? 'critical' : posterior > 0.25 ? 'high' : posterior > 0.1 ? 'medium' : 'low',
    factors: {
      basePrior: Math.round(prior * 100),
      healthStatus: upiData.overallHealth,
      avgSuccessRate: upiData.avgSuccessRate,
      peakCorrelation: Math.round(zoneProfile.upiOutage.correlationWithPeakHours * 100)
    }
  };
}

/**
 * RWA ban risk model.
 */
export function rwaBanRiskModel(zoneProfile) {
  const prob = zoneProfile.rwaBan.frequency;
  return {
    probability: Math.round(prob * 1000) / 10,
    severity: prob > 0.4 ? 'high' : prob > 0.2 ? 'medium' : 'low',
    factors: {
      affectedComplexes: zoneProfile.rwaBan.affectedComplexes,
      avgDwellIncrease: zoneProfile.rwaBan.avgDwellIncreaseMins
    }
  };
}

/**
 * Composite zone risk — all dims aggregated.
 */
export function computeCompositeRisk(zoneProfile, weatherData, trafficData, upiData) {
  const waterlog = waterloggingRiskModel(zoneProfile, weatherData || {});
  const heat = heatwaveRiskModel(zoneProfile, weatherData || {});
  const traffic = trafficRiskModel(zoneProfile, trafficData || { avgPeakCongestion: 50, eventRisk: 0 });
  const upi = upiRiskModel(zoneProfile, upiData || { overallHealth: 'healthy', avgSuccessRate: 99.5 });
  const rwa = rwaBanRiskModel(zoneProfile);

  // Weighted composite (weights reflect relative income impact)
  const weights = { waterlogging: 0.30, heatwave: 0.15, traffic: 0.25, upi: 0.20, rwa: 0.10 };
  const composite = (
    waterlog.probability * weights.waterlogging +
    heat.probability * weights.heatwave +
    traffic.probability * weights.traffic +
    upi.probability * weights.upi +
    rwa.probability * weights.rwa
  ) / 100;

  return {
    composite: Math.round(composite * 1000) / 10,
    dimensions: { waterlogging: waterlog, heatwave: heat, traffic, upi, rwa },
    weights,
    overallSeverity: composite > 60 ? 'critical' : composite > 40 ? 'high' : composite > 20 ? 'moderate' : 'low'
  };
}
