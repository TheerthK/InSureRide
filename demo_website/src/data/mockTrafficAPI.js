/**
 * Simulated Traffic & Civic Events API
 * Provides route congestion data, VIP movement alerts, and procession schedules.
 */

const CIVIC_EVENTS = [
  {
    id: 'EVT-001',
    type: 'vip_movement',
    title: 'VIP Convoy — Outer Ring Road',
    affectedZones: ['zone-hsr-layout', 'zone-koramangala'],
    affectedRoutes: ['ORR Signal → HSR Junction', '27th Main → Silk Board'],
    startTime: '17:30',
    endTime: '19:00',
    expectedDelayMins: 45,
    status: 'active',
    dayOfWeek: 4, // Thursday
    recurring: false,
    severity: 'high'
  },
  {
    id: 'EVT-002',
    type: 'religious_procession',
    title: 'Ganesh Visarjan Procession — Hosur Road',
    affectedZones: ['zone-electronic-city'],
    affectedRoutes: ['Bommasandra → Hebbagodi', 'EC Flyover Service Road'],
    startTime: '16:00',
    endTime: '21:00',
    expectedDelayMins: 90,
    status: 'scheduled',
    dayOfWeek: 5, // Friday
    recurring: false,
    severity: 'critical'
  },
  {
    id: 'EVT-003',
    type: 'political_rally',
    title: 'Political Rally — MG Road / Indiranagar',
    affectedZones: ['zone-indiranagar'],
    affectedRoutes: ['100 Feet Road', 'CMH Road → Old Airport Road'],
    startTime: '15:00',
    endTime: '18:30',
    expectedDelayMins: 60,
    status: 'scheduled',
    dayOfWeek: 3, // Wednesday
    recurring: false,
    severity: 'high'
  }
];

function generateTrafficData(zoneId) {
  const baseCongest = {
    'zone-koramangala': 0.55,
    'zone-indiranagar': 0.62,
    'zone-whitefield': 0.78,
    'zone-jayanagar': 0.35,
    'zone-hsr-layout': 0.50,
    'zone-electronic-city': 0.72,
  };

  const base = baseCongest[zoneId] || 0.5;
  const hourly = [];
  for (let h = 0; h < 24; h++) {
    let congestion = base * 0.3;
    // Morning rush 8-10
    if (h >= 8 && h <= 10) congestion = base * 0.85;
    // Lunch rush 12-14
    if (h >= 12 && h <= 14) congestion = base * 0.70;
    // Evening rush 17-20
    if (h >= 17 && h <= 20) congestion = base * 1.0;
    // Add randomness
    congestion += (Math.random() - 0.5) * 0.15;
    congestion = Math.max(0.05, Math.min(1.0, congestion));

    const avgSpeed = Math.max(2, 35 * (1 - congestion) + (Math.random() - 0.5) * 5);

    hourly.push({
      hour: h,
      congestionIndex: Math.round(congestion * 100) / 100,
      avgSpeedKmh: Math.round(avgSpeed * 10) / 10,
      isParalysis: avgSpeed < 3,
      estimatedDelayPer5km: Math.round((5 / avgSpeed) * 60 - 8.5) // minutes extra vs free flow
    });
  }
  return hourly;
}

export function getTrafficData(zoneId) {
  return {
    zoneId,
    hourly: generateTrafficData(zoneId),
    activeEvents: CIVIC_EVENTS.filter(e => e.affectedZones.includes(zoneId) && e.status === 'active'),
    scheduledEvents: CIVIC_EVENTS.filter(e => e.affectedZones.includes(zoneId) && e.status === 'scheduled'),
  };
}

export function getCivicEvents() {
  return CIVIC_EVENTS;
}

export function getTrafficRiskScore(zoneId) {
  const data = getTrafficData(zoneId);
  const peakHours = data.hourly.filter(h => (h.hour >= 8 && h.hour <= 10) || (h.hour >= 17 && h.hour <= 20));
  const avgPeakCongestion = peakHours.reduce((s, h) => s + h.congestionIndex, 0) / peakHours.length;
  const paralysisHours = data.hourly.filter(h => h.isParalysis).length;
  const eventSeverity = [...data.activeEvents, ...data.scheduledEvents]
    .reduce((s, e) => s + (e.severity === 'critical' ? 1.0 : e.severity === 'high' ? 0.7 : 0.3), 0);

  return {
    avgPeakCongestion: Math.round(avgPeakCongestion * 100),
    paralysisHours,
    eventRisk: Math.round(eventSeverity * 100) / 100,
    overallScore: Math.round((avgPeakCongestion * 50 + paralysisHours * 10 + eventSeverity * 20) * 10) / 10
  };
}
