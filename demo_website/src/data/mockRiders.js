/**
 * Mock rider profiles with behavioral baselines, trust scores,
 * claim histories, and NLP-analyzable claim text.
 */

export const RIDERS = [
  {
    id: 'RDR-1001',
    name: 'Rahul Kumar',
    phone: '+91-98765-43210',
    platform: 'Zomato',
    zoneId: 'zone-koramangala',
    joinedWeeksAgo: 48,
    trustScore: 87,
    avgDeliveriesPerDay: 18,
    avgEarningsPerWeek: 6200,
    policyId: 'POL-A100',
    policyPlan: 'premium',
    weeklyPremium: 42,
    coverageLimit: 1500,
    behavioralBaseline: {
      avgClaimsPerMonth: 1.2,
      avgClaimAmount: 95,
      preferredHours: [11, 12, 13, 14, 19, 20, 21, 22],
      claimDayDistribution: { Mon: 0.15, Tue: 0.12, Wed: 0.18, Thu: 0.20, Fri: 0.15, Sat: 0.10, Sun: 0.10 },
      topClaimZones: ['zone-koramangala'],
      avgTimeBetweenClaims: 22
    },
    claimHistory: [
      {
        id: 'CLM-5001',
        type: 'waterlogging',
        date: '2026-03-18',
        time: '14:30',
        amount: 120,
        status: 'auto-approved',
        triggerData: { rainfall: 52, durationMins: 45 },
        riderDescription: 'Heavy rain started around 2:15 PM near Sony World Junction. The underpass on 80 Feet Road was completely flooded to knee height. I had to stop and wait near the Koramangala bus stop shelter. Water was flowing across the road surface. Could not proceed for 45 minutes. Three other riders were also stranded at the same spot.',
        fraudScore: 8,
        nlpAnalysis: null
      },
      {
        id: 'CLM-5015',
        type: 'upi_outage',
        date: '2026-03-15',
        time: '20:15',
        amount: 65,
        status: 'auto-approved',
        triggerData: { outageProvider: 'PhonePe', dwellMins: 22 },
        riderDescription: 'Customer could not pay via PhonePe at delivery point in 4th Block. App showed "server error" on their screen. I waited at the building entrance for 22 minutes. Customer finally paid cash but I lost two streak deliveries and the 9 PM bonus window.',
        fraudScore: 5,
        nlpAnalysis: null
      }
    ]
  },
  {
    id: 'RDR-1002',
    name: 'Priya Sharma',
    phone: '+91-87654-32109',
    platform: 'Swiggy',
    zoneId: 'zone-indiranagar',
    joinedWeeksAgo: 32,
    trustScore: 92,
    avgDeliveriesPerDay: 22,
    avgEarningsPerWeek: 7800,
    policyId: 'POL-A101',
    policyPlan: 'premium',
    weeklyPremium: 38,
    coverageLimit: 1500,
    behavioralBaseline: {
      avgClaimsPerMonth: 0.8,
      avgClaimAmount: 78,
      preferredHours: [10, 11, 12, 13, 18, 19, 20, 21],
      claimDayDistribution: { Mon: 0.10, Tue: 0.15, Wed: 0.20, Thu: 0.15, Fri: 0.20, Sat: 0.10, Sun: 0.10 },
      topClaimZones: ['zone-indiranagar'],
      avgTimeBetweenClaims: 28
    },
    claimHistory: [
      {
        id: 'CLM-5022',
        type: 'rwa_ban',
        date: '2026-03-20',
        time: '19:45',
        amount: 85,
        status: 'auto-approved',
        triggerData: { complex: 'Brigade Millennium', dwellMins: 18 },
        riderDescription: 'Brigade Millennium gate security refused bike entry at 7:45 PM. New rule posted on gate: "No delivery vehicles beyond this point after 7 PM." Had to park at the main road and walk 400 meters to Tower 3, 12th floor. Customer was not answering phone. Total wait was 18 minutes for one delivery during peak dinner rush.',
        fraudScore: 6,
        nlpAnalysis: null
      }
    ]
  },
  {
    id: 'RDR-1003',
    name: 'Amit Yadav',
    phone: '+91-76543-21098',
    platform: 'Zepto',
    zoneId: 'zone-whitefield',
    joinedWeeksAgo: 16,
    trustScore: 62,
    avgDeliveriesPerDay: 14,
    avgEarningsPerWeek: 4900,
    policyId: 'POL-A102',
    policyPlan: 'standard',
    weeklyPremium: 52,
    coverageLimit: 1000,
    behavioralBaseline: {
      avgClaimsPerMonth: 3.2,
      avgClaimAmount: 130,
      preferredHours: [12, 13, 14, 20, 21, 22],
      claimDayDistribution: { Mon: 0.08, Tue: 0.08, Wed: 0.10, Thu: 0.35, Fri: 0.30, Sat: 0.05, Sun: 0.04 },
      topClaimZones: ['zone-whitefield', 'zone-electronic-city'],
      avgTimeBetweenClaims: 8
    },
    claimHistory: [
      {
        id: 'CLM-5030',
        type: 'waterlogging',
        date: '2026-03-28',
        time: '14:00',
        amount: 150,
        status: 'under-review',
        triggerData: { rainfall: 35, durationMins: 60 },
        riderDescription: 'Road was blocked. Water everywhere. Could not move for one hour. Lost all deliveries.',
        fraudScore: 72,
        nlpAnalysis: null
      },
      {
        id: 'CLM-5031',
        type: 'waterlogging',
        date: '2026-03-21',
        time: '14:15',
        amount: 140,
        status: 'flagged',
        triggerData: { rainfall: 28, durationMins: 55 },
        riderDescription: 'Water logging again same area. Cannot deliver. Please process payout.',
        fraudScore: 78,
        nlpAnalysis: null
      },
      {
        id: 'CLM-5032',
        type: 'traffic_paralysis',
        date: '2026-03-14',
        time: '13:50',
        amount: 145,
        status: 'flagged',
        triggerData: { avgSpeed: 2.1, durationMins: 50 },
        riderDescription: 'Stuck in traffic for long time. Complete jam. Lost deliveries.',
        fraudScore: 74,
        nlpAnalysis: null
      }
    ]
  },
  {
    id: 'RDR-1004',
    name: 'Deepa Reddy',
    phone: '+91-65432-10987',
    platform: 'Blinkit',
    zoneId: 'zone-jayanagar',
    joinedWeeksAgo: 52,
    trustScore: 95,
    avgDeliveriesPerDay: 20,
    avgEarningsPerWeek: 7200,
    policyId: 'POL-A103',
    policyPlan: 'premium',
    weeklyPremium: 28,
    coverageLimit: 1500,
    behavioralBaseline: {
      avgClaimsPerMonth: 0.5,
      avgClaimAmount: 65,
      preferredHours: [9, 10, 11, 12, 17, 18, 19, 20],
      claimDayDistribution: { Mon: 0.20, Tue: 0.15, Wed: 0.15, Thu: 0.15, Fri: 0.15, Sat: 0.10, Sun: 0.10 },
      topClaimZones: ['zone-jayanagar'],
      avgTimeBetweenClaims: 45
    },
    claimHistory: [
      {
        id: 'CLM-5040',
        type: 'heatwave',
        date: '2026-03-25',
        time: '13:30',
        amount: 70,
        status: 'auto-approved',
        triggerData: { temperature: 46.2, feelsLike: 48.5, durationMins: 35 },
        riderDescription: 'Temperature at 1:30 PM near Jayanagar 4th Block crossing was unbearable. My phone showed 46 degrees. The asphalt was radiating heat and I felt dizzy after 3 consecutive deliveries. Parked under the Metro station shade near Raghavendra Swamy Math for 35 minutes to recover. I drank 2 litres of water during that time. Re-started deliveries only after 2:05 PM when some cloud cover appeared.',
        fraudScore: 3,
        nlpAnalysis: null
      }
    ]
  },
  {
    id: 'RDR-1005',
    name: 'Suresh Babu',
    phone: '+91-54321-09876',
    platform: 'Zomato',
    zoneId: 'zone-hsr-layout',
    joinedWeeksAgo: 24,
    trustScore: 45,
    avgDeliveriesPerDay: 12,
    avgEarningsPerWeek: 4100,
    policyId: 'POL-A104',
    policyPlan: 'basic',
    weeklyPremium: 34,
    coverageLimit: 750,
    behavioralBaseline: {
      avgClaimsPerMonth: 4.5,
      avgClaimAmount: 142,
      preferredHours: [13, 14, 20, 21],
      claimDayDistribution: { Mon: 0.05, Tue: 0.05, Wed: 0.05, Thu: 0.40, Fri: 0.35, Sat: 0.05, Sun: 0.05 },
      topClaimZones: ['zone-hsr-layout', 'zone-koramangala', 'zone-electronic-city'],
      avgTimeBetweenClaims: 5
    },
    claimHistory: [
      {
        id: 'CLM-5050',
        type: 'waterlogging',
        date: '2026-03-27',
        time: '14:10',
        amount: 150,
        status: 'rejected',
        triggerData: { rainfall: 12, durationMins: 60 },
        riderDescription: 'Water logging happened. Road blocked completely. Could not move.',
        fraudScore: 92,
        nlpAnalysis: null
      },
      {
        id: 'CLM-5051',
        type: 'traffic_paralysis',
        date: '2026-03-20',
        time: '13:55',
        amount: 148,
        status: 'rejected',
        triggerData: { avgSpeed: 8.5, durationMins: 45 },
        riderDescription: 'Traffic jam near HSR. Cannot deliver anything. Please pay.',
        fraudScore: 95,
        nlpAnalysis: null
      },
      {
        id: 'CLM-5052',
        type: 'upi_outage',
        date: '2026-03-13',
        time: '20:30',
        amount: 140,
        status: 'rejected',
        triggerData: { outageProvider: 'GPay', dwellMins: 8 },
        riderDescription: 'Payment not working. Customer cannot pay. Waited long time.',
        fraudScore: 88,
        nlpAnalysis: null
      }
    ]
  },
  {
    id: 'RDR-1006',
    name: 'Kavitha Nair',
    phone: '+91-43210-98765',
    platform: 'Swiggy',
    zoneId: 'zone-electronic-city',
    joinedWeeksAgo: 40,
    trustScore: 78,
    avgDeliveriesPerDay: 16,
    avgEarningsPerWeek: 5600,
    policyId: 'POL-A105',
    policyPlan: 'standard',
    weeklyPremium: 45,
    coverageLimit: 1000,
    behavioralBaseline: {
      avgClaimsPerMonth: 1.8,
      avgClaimAmount: 105,
      preferredHours: [11, 12, 13, 19, 20, 21, 22],
      claimDayDistribution: { Mon: 0.15, Tue: 0.15, Wed: 0.15, Thu: 0.15, Fri: 0.15, Sat: 0.15, Sun: 0.10 },
      topClaimZones: ['zone-electronic-city'],
      avgTimeBetweenClaims: 15
    },
    claimHistory: [
      {
        id: 'CLM-5060',
        type: 'traffic_paralysis',
        date: '2026-03-22',
        time: '19:20',
        amount: 110,
        status: 'auto-approved',
        triggerData: { avgSpeed: 1.8, durationMins: 52 },
        riderDescription: 'There was a Ganesh procession on Hosur Road near Electronic City flyover. The entire stretch from Bommasandra to Hebbagodi was at standstill. Police had barricaded the service road as well. I was carrying a Swiggy Instamart order that was supposed to be 10-min delivery — ended up taking 68 minutes. I could see the procession moving at walking pace ahead of me. Google Maps was showing all alternate routes in dark red.',
        fraudScore: 7,
        nlpAnalysis: null
      }
    ]
  },
  {
    id: 'RDR-1007',
    name: 'Mohammed Farhan',
    phone: '+91-32109-87654',
    platform: 'Zepto',
    zoneId: 'zone-koramangala',
    joinedWeeksAgo: 8,
    trustScore: 55,
    avgDeliveriesPerDay: 10,
    avgEarningsPerWeek: 3500,
    policyId: 'POL-A106',
    policyPlan: 'basic',
    weeklyPremium: 40,
    coverageLimit: 750,
    behavioralBaseline: {
      avgClaimsPerMonth: 3.8,
      avgClaimAmount: 138,
      preferredHours: [13, 14, 21, 22],
      claimDayDistribution: { Mon: 0.05, Tue: 0.05, Wed: 0.05, Thu: 0.42, Fri: 0.38, Sat: 0.03, Sun: 0.02 },
      topClaimZones: ['zone-koramangala', 'zone-whitefield'],
      avgTimeBetweenClaims: 6
    },
    claimHistory: [
      {
        id: 'CLM-5070',
        type: 'waterlogging',
        date: '2026-03-28',
        time: '14:05',
        amount: 148,
        status: 'flagged',
        triggerData: { rainfall: 30, durationMins: 58 },
        riderDescription: 'Road was blocked. Water everywhere. Could not move for one hour. Lost all deliveries.',
        fraudScore: 85,
        nlpAnalysis: null
      }
    ]
  },
  {
    id: 'RDR-1008',
    name: 'Lakshmi Devi',
    phone: '+91-21098-76543',
    platform: 'Blinkit',
    zoneId: 'zone-indiranagar',
    joinedWeeksAgo: 36,
    trustScore: 88,
    avgDeliveriesPerDay: 19,
    avgEarningsPerWeek: 6800,
    policyId: 'POL-A107',
    policyPlan: 'premium',
    weeklyPremium: 36,
    coverageLimit: 1500,
    behavioralBaseline: {
      avgClaimsPerMonth: 1.0,
      avgClaimAmount: 82,
      preferredHours: [10, 11, 12, 13, 18, 19, 20],
      claimDayDistribution: { Mon: 0.18, Tue: 0.15, Wed: 0.15, Thu: 0.15, Fri: 0.15, Sat: 0.12, Sun: 0.10 },
      topClaimZones: ['zone-indiranagar'],
      avgTimeBetweenClaims: 25
    },
    claimHistory: []
  },
  {
    id: 'RDR-1009',
    name: 'Venkatesh Murthy',
    phone: '+91-10987-65432',
    platform: 'Zomato',
    zoneId: 'zone-jayanagar',
    joinedWeeksAgo: 44,
    trustScore: 91,
    avgDeliveriesPerDay: 21,
    avgEarningsPerWeek: 7400,
    policyId: 'POL-A108',
    policyPlan: 'premium',
    weeklyPremium: 30,
    coverageLimit: 1500,
    behavioralBaseline: {
      avgClaimsPerMonth: 0.6,
      avgClaimAmount: 70,
      preferredHours: [10, 11, 12, 13, 17, 18, 19, 20],
      claimDayDistribution: { Mon: 0.15, Tue: 0.15, Wed: 0.18, Thu: 0.15, Fri: 0.15, Sat: 0.12, Sun: 0.10 },
      topClaimZones: ['zone-jayanagar'],
      avgTimeBetweenClaims: 38
    },
    claimHistory: [
      {
        id: 'CLM-5080',
        type: 'rwa_ban',
        date: '2026-03-19',
        time: '18:30',
        amount: 60,
        status: 'auto-approved',
        triggerData: { complex: 'Mantri Residency', dwellMins: 15 },
        riderDescription: 'Mantri Residency main gate guard stopped me at 6:30 PM. He said new management circular came yesterday — all delivery bikes must use the service entrance near Block D which is 600 meters around the compound wall. The service entrance was locked and I had to call the guard there separately. He took 8 minutes to come. Then I walked to Tower A, 8th floor. The whole process added 15 minutes for what should have been a 2-minute drop-off.',
        fraudScore: 4,
        nlpAnalysis: null
      }
    ]
  },
  {
    id: 'RDR-1010',
    name: 'Raju Gowda',
    phone: '+91-09876-54321',
    platform: 'Swiggy',
    zoneId: 'zone-hsr-layout',
    joinedWeeksAgo: 20,
    trustScore: 70,
    avgDeliveriesPerDay: 15,
    avgEarningsPerWeek: 5200,
    policyId: 'POL-A109',
    policyPlan: 'standard',
    weeklyPremium: 36,
    coverageLimit: 1000,
    behavioralBaseline: {
      avgClaimsPerMonth: 2.0,
      avgClaimAmount: 98,
      preferredHours: [11, 12, 13, 14, 19, 20, 21],
      claimDayDistribution: { Mon: 0.12, Tue: 0.12, Wed: 0.18, Thu: 0.22, Fri: 0.18, Sat: 0.10, Sun: 0.08 },
      topClaimZones: ['zone-hsr-layout'],
      avgTimeBetweenClaims: 12
    },
    claimHistory: [
      {
        id: 'CLM-5090',
        type: 'festive_block',
        date: '2026-03-26',
        time: '17:45',
        amount: 95,
        status: 'auto-approved',
        triggerData: { eventType: 'VIP Movement', routesClosed: 3, durationMins: 40 },
        riderDescription: 'VIP convoy was passing through Outer Ring Road near HSR Layout signal at around 5:45 PM. Police had blocked both directions of traffic at the 27th Main junction. There were about 200+ vehicles stuck on both sides. I was carrying a food delivery from a restaurant in Sector 2 to a customer in Sector 7 — a distance that normally takes 4 minutes. I was stuck for 40 minutes. The convoy had at least 8-10 vehicles with pilot cars. Traffic police were not allowing any movement even on side roads.',
        fraudScore: 5,
        nlpAnalysis: null
      }
    ]
  }
];

export const getRiderById = (id) => RIDERS.find(r => r.id === id);
export const getRidersByZone = (zoneId) => RIDERS.filter(r => r.zoneId === zoneId);
export const getRidersByTrustLevel = (minScore) => RIDERS.filter(r => r.trustScore >= minScore);
export const getHighRiskRiders = () => RIDERS.filter(r => r.trustScore < 60);
export const getAllClaims = () => RIDERS.flatMap(r => r.claimHistory.map(c => ({ ...c, riderId: r.id, riderName: r.name, zoneId: r.zoneId })));
