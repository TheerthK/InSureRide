/**
 * AUTOMATED TRIGGER ENGINE
 * 5 disruption triggers that monitor APIs and auto-fire claims.
 */

import { getCurrentWeather, getWeatherForecast } from '../data/mockWeatherAPI.js';
import { getTrafficData } from '../data/mockTrafficAPI.js';
import { getActiveOutages } from '../data/mockUPIStatusAPI.js';

const TRIGGER_DEFS = [
  { id: 'TRG-WEATHER', name: 'Climate Pause', type: 'waterlogging', icon: '🌧️', description: 'Rainfall >40mm/hr or waterlogging probability >60% in rider zone', threshold: { rainfall: 40, waterloggingProb: 0.6 } },
  { id: 'TRG-HEAT', name: 'Heatwave Shield', type: 'heatwave', icon: '🔥', description: 'Feels-like temperature exceeds 45°C during working hours', threshold: { feelsLike: 45 } },
  { id: 'TRG-UPI', name: 'Payment Crash Guard', type: 'upi_outage', icon: '💳', description: 'UPI gateway down + rider dwelling at delivery point >20min', threshold: { dwellMins: 20 } },
  { id: 'TRG-TRAFFIC', name: 'Route Paralysis Cover', type: 'traffic_paralysis', icon: '🚧', description: 'Rider speed <3 km/h for >45 minutes during active delivery', threshold: { speedKmh: 3, durationMins: 45 } },
  { id: 'TRG-CIVIC', name: 'Civic Event Shield', type: 'festive_block', icon: '🎪', description: 'Procession/VIP movement blocking rider delivery route', threshold: { routeOverlap: true } },
];

export function getTriggerDefinitions() { return TRIGGER_DEFS; }

export function evaluateTriggers(rider, zone) {
  const weather = getCurrentWeather(zone.id);
  const traffic = getTrafficData(zone.id);
  const outages = getActiveOutages();
  const forecast = getWeatherForecast(zone.id);

  const results = TRIGGER_DEFS.map(trig => {
    let fired = false, confidence = 0, evidence = {}, payoutEstimate = 0;

    switch (trig.type) {
      case 'waterlogging': {
        const precip = weather.precipitation || 0;
        const wlProb = weather.waterloggingProbability || 0;
        fired = precip > trig.threshold.rainfall || wlProb > trig.threshold.waterloggingProb;
        confidence = fired ? Math.min(98, Math.round((precip / 60 + wlProb) * 50)) : Math.round(Math.max(precip / 60, wlProb) * 40);
        evidence = { currentRainfall: precip, waterloggingProb: Math.round(wlProb * 100), threshold: trig.threshold.rainfall };
        payoutEstimate = fired ? Math.round(80 + precip * 0.8) : 0;
        break;
      }
      case 'heatwave': {
        const fl = weather.feelsLike || 0;
        fired = fl > trig.threshold.feelsLike;
        confidence = fired ? Math.min(95, Math.round((fl - 40) * 15)) : Math.round(Math.max(0, (fl - 38) / 7) * 40);
        evidence = { feelsLike: fl, threshold: trig.threshold.feelsLike };
        payoutEstimate = fired ? Math.round(60 + (fl - 45) * 10) : 0;
        break;
      }
      case 'upi_outage': {
        const hasOutage = outages.length > 0;
        fired = hasOutage;
        confidence = hasOutage ? 88 : 5;
        evidence = { activeOutages: outages.map(o => o.providerName), affectedTransactions: outages.reduce((s, o) => s + o.affectedTransactions, 0) };
        payoutEstimate = fired ? 65 : 0;
        break;
      }
      case 'traffic_paralysis': {
        const hour = new Date().getHours();
        const hData = traffic.hourly[hour] || traffic.hourly[12];
        fired = hData.avgSpeedKmh < trig.threshold.speedKmh;
        confidence = fired ? Math.min(92, Math.round((1 - hData.avgSpeedKmh / 10) * 100)) : Math.round((1 - hData.avgSpeedKmh / 35) * 50);
        evidence = { currentSpeed: hData.avgSpeedKmh, congestion: hData.congestionIndex, threshold: trig.threshold.speedKmh };
        payoutEstimate = fired ? Math.round(90 + (trig.threshold.speedKmh - hData.avgSpeedKmh) * 20) : 0;
        break;
      }
      case 'festive_block': {
        const evts = [...traffic.activeEvents, ...traffic.scheduledEvents];
        fired = evts.length > 0;
        confidence = fired ? (traffic.activeEvents.length > 0 ? 90 : 60) : 5;
        evidence = { events: evts.map(e => ({ title: e.title, type: e.type, delay: e.expectedDelayMins })) };
        payoutEstimate = fired ? Math.round(70 + (evts[0]?.expectedDelayMins || 0) * 0.5) : 0;
        break;
      }
    }

    return { ...trig, fired, confidence, evidence, payoutEstimate, status: fired ? 'TRIGGERED' : confidence > 40 ? 'MONITORING' : 'CLEAR', timestamp: new Date().toISOString() };
  });

  return { triggers: results, activeTriggers: results.filter(t => t.fired), monitoringTriggers: results.filter(t => !t.fired && t.confidence > 40) };
}

export function simulateTriggerTimeline(zone) {
  const forecast = getWeatherForecast(zone.id);
  const timeline = [];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  forecast.forEach((day, i) => {
    if (day.severeRainAlert) timeline.push({ day: days[i], hour: 14, trigger: 'TRG-WEATHER', event: `Heavy rainfall (${day.totalPrecipitation}mm)`, confidence: 85, type: 'waterlogging' });
    if (day.heatwaveAlert) timeline.push({ day: days[i], hour: 13, trigger: 'TRG-HEAT', event: `Heatwave (feels ${day.maxFeelsLike}°C)`, confidence: 90, type: 'heatwave' });
  });
  return timeline;
}
