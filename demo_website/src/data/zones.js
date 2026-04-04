/**
 * Zone definitions with hyper-local risk profiles.
 * Each zone has historical metrics across 5 disruption dimensions.
 * Risk histories are based on 52-week rolling averages.
 */

export const ZONES = [
  {
    id: 'zone-koramangala',
    name: 'Koramangala',
    city: 'Bengaluru',
    lat: 12.9352,
    lng: 77.6245,
    riderDensity: 342,
    riskProfile: {
      waterlogging: { frequency: 0.72, severity: 'high', weeklyIncidents: 3.2, safeWeeksStreak: 0 },
      heatwave: { frequency: 0.15, severity: 'low', avgPeakTemp: 34.2, safeWeeksStreak: 12 },
      upiOutage: { frequency: 0.08, severity: 'medium', avgDurationMins: 22, correlationWithPeakHours: 0.65 },
      trafficParalysis: { frequency: 0.45, severity: 'medium', avgDelayMins: 38, vipMovementRisk: 0.3 },
      rwaBan: { frequency: 0.22, severity: 'low', affectedComplexes: 8, avgDwellIncreaseMins: 12 }
    },
    historicalClaimRate: 0.18,
    avgWeeklyPremium: 38,
    safetyClassification: 'moderate-risk',
    monsoonMultiplier: 1.45,
    winterMultiplier: 0.82
  },
  {
    id: 'zone-indiranagar',
    name: 'Indiranagar',
    city: 'Bengaluru',
    lat: 12.9784,
    lng: 77.6408,
    riderDensity: 289,
    riskProfile: {
      waterlogging: { frequency: 0.35, severity: 'medium', weeklyIncidents: 1.4, safeWeeksStreak: 4 },
      heatwave: { frequency: 0.18, severity: 'low', avgPeakTemp: 33.8, safeWeeksStreak: 14 },
      upiOutage: { frequency: 0.08, severity: 'medium', avgDurationMins: 22, correlationWithPeakHours: 0.65 },
      trafficParalysis: { frequency: 0.55, severity: 'high', avgDelayMins: 45, vipMovementRisk: 0.5 },
      rwaBan: { frequency: 0.38, severity: 'high', affectedComplexes: 15, avgDwellIncreaseMins: 18 }
    },
    historicalClaimRate: 0.15,
    avgWeeklyPremium: 35,
    safetyClassification: 'moderate-risk',
    monsoonMultiplier: 1.25,
    winterMultiplier: 0.85
  },
  {
    id: 'zone-whitefield',
    name: 'Whitefield',
    city: 'Bengaluru',
    lat: 12.9698,
    lng: 77.7500,
    riderDensity: 198,
    riskProfile: {
      waterlogging: { frequency: 0.82, severity: 'critical', weeklyIncidents: 4.1, safeWeeksStreak: 0 },
      heatwave: { frequency: 0.12, severity: 'low', avgPeakTemp: 33.5, safeWeeksStreak: 16 },
      upiOutage: { frequency: 0.08, severity: 'medium', avgDurationMins: 22, correlationWithPeakHours: 0.65 },
      trafficParalysis: { frequency: 0.68, severity: 'critical', avgDelayMins: 55, vipMovementRisk: 0.2 },
      rwaBan: { frequency: 0.52, severity: 'high', affectedComplexes: 22, avgDwellIncreaseMins: 20 }
    },
    historicalClaimRate: 0.28,
    avgWeeklyPremium: 48,
    safetyClassification: 'high-risk',
    monsoonMultiplier: 1.65,
    winterMultiplier: 0.78
  },
  {
    id: 'zone-jayanagar',
    name: 'Jayanagar',
    city: 'Bengaluru',
    lat: 12.9250,
    lng: 77.5938,
    riderDensity: 256,
    riskProfile: {
      waterlogging: { frequency: 0.18, severity: 'low', weeklyIncidents: 0.6, safeWeeksStreak: 8 },
      heatwave: { frequency: 0.20, severity: 'medium', avgPeakTemp: 35.1, safeWeeksStreak: 10 },
      upiOutage: { frequency: 0.08, severity: 'medium', avgDurationMins: 22, correlationWithPeakHours: 0.65 },
      trafficParalysis: { frequency: 0.30, severity: 'low', avgDelayMins: 25, vipMovementRisk: 0.15 },
      rwaBan: { frequency: 0.10, severity: 'low', affectedComplexes: 4, avgDwellIncreaseMins: 8 }
    },
    historicalClaimRate: 0.08,
    avgWeeklyPremium: 28,
    safetyClassification: 'low-risk',
    monsoonMultiplier: 1.10,
    winterMultiplier: 0.90
  },
  {
    id: 'zone-hsr-layout',
    name: 'HSR Layout',
    city: 'Bengaluru',
    lat: 12.9116,
    lng: 77.6389,
    riderDensity: 312,
    riskProfile: {
      waterlogging: { frequency: 0.55, severity: 'medium', weeklyIncidents: 2.2, safeWeeksStreak: 2 },
      heatwave: { frequency: 0.16, severity: 'low', avgPeakTemp: 34.0, safeWeeksStreak: 13 },
      upiOutage: { frequency: 0.08, severity: 'medium', avgDurationMins: 22, correlationWithPeakHours: 0.65 },
      trafficParalysis: { frequency: 0.40, severity: 'medium', avgDelayMins: 35, vipMovementRisk: 0.25 },
      rwaBan: { frequency: 0.28, severity: 'medium', affectedComplexes: 11, avgDwellIncreaseMins: 14 }
    },
    historicalClaimRate: 0.14,
    avgWeeklyPremium: 34,
    safetyClassification: 'moderate-risk',
    monsoonMultiplier: 1.35,
    winterMultiplier: 0.84
  },
  {
    id: 'zone-electronic-city',
    name: 'Electronic City',
    city: 'Bengaluru',
    lat: 12.8440,
    lng: 77.6765,
    riderDensity: 145,
    riskProfile: {
      waterlogging: { frequency: 0.90, severity: 'critical', weeklyIncidents: 5.0, safeWeeksStreak: 0 },
      heatwave: { frequency: 0.25, severity: 'medium', avgPeakTemp: 36.2, safeWeeksStreak: 6 },
      upiOutage: { frequency: 0.08, severity: 'medium', avgDurationMins: 22, correlationWithPeakHours: 0.65 },
      trafficParalysis: { frequency: 0.75, severity: 'critical', avgDelayMins: 62, vipMovementRisk: 0.1 },
      rwaBan: { frequency: 0.15, severity: 'low', affectedComplexes: 5, avgDwellIncreaseMins: 10 }
    },
    historicalClaimRate: 0.32,
    avgWeeklyPremium: 52,
    safetyClassification: 'high-risk',
    monsoonMultiplier: 1.75,
    winterMultiplier: 0.75
  }
];

export const getZoneById = (id) => ZONES.find(z => z.id === id);
export const getZonesByRisk = (level) => ZONES.filter(z => z.safetyClassification === level);
export const getZoneRiskScore = (zone) => {
  const p = zone.riskProfile;
  return Math.round(
    (p.waterlogging.frequency * 30 +
     p.heatwave.frequency * 15 +
     p.upiOutage.frequency * 20 +
     p.trafficParalysis.frequency * 25 +
     p.rwaBan.frequency * 10) * 100
  ) / 100;
};
