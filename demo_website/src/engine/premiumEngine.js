/**
 * DYNAMIC PREMIUM CALCULATION ENGINE
 * 
 * Calculates weekly premiums using a multi-factor pricing model:
 * 
 * Premium_weekly = B + Σ(w_i × R_i × S_zone) × T_seasonal 
 *                  - α × TrustDiscount 
 *                  - β × SafeZoneDiscount 
 *                  + γ × PredictiveWeatherSurcharge
 *                  + δ × ClaimHistoryLoading
 * 
 * This is NOT a flat lookup. Every factor contributes a calculable, 
 * explainable rupee amount that riders can see and understand.
 */

import { computeCompositeRisk } from './riskModels.js';
import { getWeatherForecast, getWeatherRiskScore } from '../data/mockWeatherAPI.js';
import { getTrafficRiskScore } from '../data/mockTrafficAPI.js';
import { getUPIRiskScore } from '../data/mockUPIStatusAPI.js';

// --- Constants ---
const BASE_RATE = 25; // Minimum viable ₹/week
const TRUST_DISCOUNT_COEFF = 0.18; // α: per-point trust discount
const SAFE_ZONE_DISCOUNT_MAX = 5; // β: max weekly discount for safe zones
const WEATHER_SURCHARGE_COEFF = 1.2; // γ: weather prediction surcharge multiplier
const CLAIM_LOADING_COEFF = 0.8; // δ: claim history loading multiplier

// Risk dimension weights (ML-calibrated from simulated historical data)
const RISK_WEIGHTS = {
  waterlogging: 4.5,   // ₹ per 10% probability
  heatwave: 2.0,      
  traffic: 3.5,        
  upi: 2.5,           
  rwa: 1.5,           
};

// Seasonal multipliers
const SEASONAL_MULTIPLIERS = {
  monsoon: 1.35,     // June-September
  preMonsoon: 1.15,  // March-May
  winter: 0.85,      // November-February
  postMonsoon: 1.05, // October
};

// Policy plan multipliers and coverage
export const POLICY_PLANS = {
  basic: {
    name: 'Basic Shield',
    coverageLimit: 750,
    premiumMultiplier: 0.75,
    maxPayoutPerIncident: 150,
    coveredTriggers: ['waterlogging', 'heatwave'],
    description: 'Essential protection against weather disruptions'
  },
  standard: {
    name: 'Standard Guard',
    coverageLimit: 1000,
    premiumMultiplier: 1.0,
    maxPayoutPerIncident: 200,
    coveredTriggers: ['waterlogging', 'heatwave', 'upi_outage', 'traffic_paralysis'],
    description: 'Comprehensive coverage for common disruptions'
  },
  premium: {
    name: 'Premium Fortress',
    coverageLimit: 1500,
    premiumMultiplier: 1.3,
    maxPayoutPerIncident: 300,
    coveredTriggers: ['waterlogging', 'heatwave', 'upi_outage', 'traffic_paralysis', 'rwa_ban', 'festive_block'],
    description: 'Maximum protection — all disruption types covered'
  }
};

function getCurrentSeason() {
  const month = new Date().getMonth(); // 0-indexed
  if (month >= 5 && month <= 8) return 'monsoon';
  if (month >= 2 && month <= 4) return 'preMonsoon';
  if (month === 9) return 'postMonsoon';
  return 'winter';
}

/**
 * Calculate claim history loading.
 * Riders with more frequent/higher claims pay more — adverse selection prevention.
 */
function calculateClaimLoading(rider) {
  const monthlyClaimRate = rider.behavioralBaseline.avgClaimsPerMonth;
  const avgAmount = rider.behavioralBaseline.avgClaimAmount;
  
  // Expected monthly cost per rider
  const expectedMonthlyCost = monthlyClaimRate * avgAmount;
  // Industry baseline: 1 claim/month at ₹85 avg
  const baselineMonthlyCost = 1.0 * 85;
  
  // Loading is proportional to excess over baseline
  const excessRatio = Math.max(0, (expectedMonthlyCost - baselineMonthlyCost) / baselineMonthlyCost);
  return Math.round(excessRatio * CLAIM_LOADING_COEFF * 100) / 100;
}

/**
 * Calculate safe zone discount.
 * Zones with historically low waterlogging get ₹2-5 discount per week.
 */
function calculateSafeZoneDiscount(zone) {
  const safeStreak = zone.riskProfile.waterlogging.safeWeeksStreak;
  // Discount scales with consecutive safe weeks (capped at 5)
  const discount = Math.min(SAFE_ZONE_DISCOUNT_MAX, safeStreak * 0.6);
  return Math.round(discount * 100) / 100;
}

/**
 * Calculate trust-based discount.
 * Higher trust score → lower premium (rewarding genuine riders).
 */
function calculateTrustDiscount(trustScore) {
  // Only scores above 60 get discounts; max discount at score 100
  if (trustScore < 60) return 0;
  const discount = (trustScore - 60) * TRUST_DISCOUNT_COEFF;
  return Math.round(discount * 100) / 100;
}

/**
 * Calculate predictive weather surcharge.
 * Uses 7-day forecast to anticipate disruption costs.
 */
function calculateWeatherSurcharge(zoneId) {
  const forecast = getWeatherForecast(zoneId);
  const riskScore = getWeatherRiskScore(zoneId);
  
  // Count severe weather days
  const severeDays = forecast.filter(d => d.severeRainAlert || d.heatwaveAlert).length;
  
  if (!riskScore.surchargeApplicable) return { amount: 0, severeDays: 0, reason: 'No severe weather forecast' };
  
  const surcharge = riskScore.surchargeAmount * WEATHER_SURCHARGE_COEFF;
  return {
    amount: Math.round(surcharge * 100) / 100,
    severeDays,
    reason: `${severeDays} severe weather day(s) forecast — ${riskScore.rainDays} rain, ${riskScore.heatDays} heat`
  };
}

/**
 * MAIN PREMIUM CALCULATION
 * Returns a full breakdown of every factor contributing to the final premium.
 */
export function calculatePremium(rider, zone) {
  const season = getCurrentSeason();
  const seasonalMultiplier = SEASONAL_MULTIPLIERS[season];
  const plan = POLICY_PLANS[rider.policyPlan || 'standard'];
  
  // Get risk data from APIs
  const weatherRisk = getWeatherRiskScore(zone.id);
  const trafficRisk = getTrafficRiskScore(zone.id);
  const upiRisk = getUPIRiskScore();
  
  // Get composite risk from Bayesian models
  const compositeRisk = computeCompositeRisk(
    zone.riskProfile,
    { totalPrecipitation: weatherRisk.weeklyScore * 1.5, maxFeelsLike: 35 + weatherRisk.heatDays * 3 },
    trafficRisk,
    upiRisk
  );
  
  // --- Factor calculations ---
  
  // 1. Base rate
  const baseComponent = BASE_RATE;
  
  // 2. Risk factor loading (per dimension)
  const riskComponents = {};
  let totalRiskLoading = 0;
  for (const [dim, weight] of Object.entries(RISK_WEIGHTS)) {
    const riskProb = compositeRisk.dimensions[dim]?.probability || 0;
    const loading = (riskProb / 10) * weight * (zone.monsoonMultiplier > 1.3 ? 1.15 : 1.0);
    riskComponents[dim] = {
      probability: riskProb,
      weight,
      loading: Math.round(loading * 100) / 100
    };
    totalRiskLoading += loading;
  }
  
  // 3. Seasonal adjustment
  const seasonalComponent = totalRiskLoading * (seasonalMultiplier - 1);
  
  // 4. Trust discount
  const trustDiscount = calculateTrustDiscount(rider.trustScore);
  
  // 5. Safe zone discount
  const safeZoneDiscount = calculateSafeZoneDiscount(zone);
  
  // 6. Weather surcharge
  const weatherSurcharge = calculateWeatherSurcharge(zone.id);
  
  // 7. Claim history loading
  const claimLoadingRatio = calculateClaimLoading(rider);
  const claimLoading = claimLoadingRatio * BASE_RATE;
  
  // 8. Plan multiplier
  const subtotal = baseComponent + totalRiskLoading + seasonalComponent + weatherSurcharge.amount + claimLoading - trustDiscount - safeZoneDiscount;
  const planAdjusted = subtotal * plan.premiumMultiplier;
  
  // Final premium (min ₹15, max ₹85)
  const finalPremium = Math.max(15, Math.min(85, Math.round(planAdjusted * 100) / 100));
  
  return {
    finalPremium,
    breakdown: {
      baseRate: baseComponent,
      riskLoading: {
        total: Math.round(totalRiskLoading * 100) / 100,
        dimensions: riskComponents
      },
      seasonalAdjustment: {
        season,
        multiplier: seasonalMultiplier,
        amount: Math.round(seasonalComponent * 100) / 100
      },
      trustDiscount: {
        trustScore: rider.trustScore,
        amount: trustDiscount
      },
      safeZoneDiscount: {
        safeWeeksStreak: zone.riskProfile.waterlogging.safeWeeksStreak,
        amount: safeZoneDiscount
      },
      weatherSurcharge,
      claimHistoryLoading: {
        ratio: claimLoadingRatio,
        amount: Math.round(claimLoading * 100) / 100
      },
      planMultiplier: {
        plan: rider.policyPlan,
        multiplier: plan.premiumMultiplier
      }
    },
    compositeRisk,
    plan,
    coverageLimit: plan.coverageLimit
  };
}

/**
 * Compare premiums across zones for a rider.
 */
export function compareZonePremiums(rider, zones) {
  return zones.map(zone => ({
    zone: zone.name,
    zoneId: zone.id,
    ...calculatePremium(rider, zone)
  }));
}

/**
 * Generate weekly premium forecast (next 4 weeks simulation).
 */
export function weeklyPremiumForecast(rider, zone) {
  const basePremium = calculatePremium(rider, zone);
  const weeks = [];
  for (let w = 0; w < 4; w++) {
    // Simulate varying conditions
    const variance = (Math.random() - 0.5) * 8;
    const forecasted = Math.max(15, Math.min(85, basePremium.finalPremium + variance));
    weeks.push({
      week: w + 1,
      label: `Week ${w + 1}`,
      premium: Math.round(forecasted * 100) / 100,
      trend: variance > 0 ? 'up' : 'down',
      reason: variance > 2 ? 'Weather risk increase' : variance < -2 ? 'Improved conditions' : 'Stable'
    });
  }
  return weeks;
}
