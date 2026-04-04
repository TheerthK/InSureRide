/**
 * GRAPH NEURAL NETWORK (GNN) FRAUD DETECTION ENGINE
 * 
 * Inspired by NASA's EOSDIS-GNN GraphSAGE architecture.
 * Models riders, zones, claims, and transactions as a heterogeneous graph.
 * Uses SAGE-style message passing to detect fraud rings and collusion.
 * 
 * Architecture:
 * - Heterogeneous graph with 4 node types: Rider, Zone, Claim, Transaction
 * - Edge types: CLAIMS_FROM, OPERATES_IN, TRANSACTS_WITH, CO_LOCATED, SIMILAR_PATTERN
 * - 3-layer message passing with neighborhood aggregation
 * - Anomaly detection via embedding distance from cluster centroids
 * 
 * Reference: GraphSAGE (Hamilton et al., 2017) + Heterogeneous GNN
 */

import { RIDERS } from '../data/mockRiders.js';
import { ZONES } from '../data/zones.js';

// ======================== GRAPH CONSTRUCTION ========================

/**
 * Build a heterogeneous fraud detection graph from rider and zone data.
 * Node types: rider, zone, claim, timeslot
 * Edge types model relationships between entities.
 */
export function buildFraudGraph(riders, zones) {
  const nodes = [];
  const edges = [];
  const nodeIndex = {};
  let idx = 0;

  // --- Create Rider Nodes ---
  riders.forEach(r => {
    const nodeId = `rider:${r.id}`;
    nodeIndex[nodeId] = idx;
    nodes.push({
      id: nodeId,
      idx: idx++,
      type: 'rider',
      label: r.name,
      features: normalizeRiderFeatures(r),
      embedding: null, // Computed during message passing
      metadata: { trustScore: r.trustScore, platform: r.platform, claims: r.claimHistory.length }
    });
  });

  // --- Create Zone Nodes ---
  zones.forEach(z => {
    const nodeId = `zone:${z.id}`;
    nodeIndex[nodeId] = idx;
    nodes.push({
      id: nodeId,
      idx: idx++,
      type: 'zone',
      label: z.name,
      features: normalizeZoneFeatures(z),
      embedding: null,
      metadata: { riskClass: z.safetyClassification, riderDensity: z.riderDensity }
    });
  });

  // --- Create Claim Nodes ---
  riders.forEach(r => {
    r.claimHistory.forEach(c => {
      const nodeId = `claim:${c.id}`;
      nodeIndex[nodeId] = idx;
      nodes.push({
        id: nodeId,
        idx: idx++,
        type: 'claim',
        label: c.id,
        features: normalizeClaimFeatures(c),
        embedding: null,
        metadata: { type: c.type, amount: c.amount, status: c.status, date: c.date }
      });
    });
  });

  // --- Create Timeslot Nodes (24 hours) ---
  for (let h = 0; h < 24; h++) {
    const nodeId = `timeslot:${h}`;
    nodeIndex[nodeId] = idx;
    nodes.push({
      id: nodeId,
      idx: idx++,
      type: 'timeslot',
      label: `${h}:00`,
      features: [h / 24, Math.sin(h * Math.PI / 12), Math.cos(h * Math.PI / 12), h >= 11 && h <= 14 ? 1 : 0, h >= 19 && h <= 22 ? 1 : 0],
      embedding: null,
      metadata: { hour: h, isPeakLunch: h >= 11 && h <= 14, isPeakDinner: h >= 19 && h <= 22 }
    });
  }

  // --- Create Edges ---

  // OPERATES_IN: rider → zone
  riders.forEach(r => {
    const riderId = `rider:${r.id}`;
    const zoneId = `zone:${r.zoneId}`;
    if (nodeIndex[riderId] !== undefined && nodeIndex[zoneId] !== undefined) {
      edges.push({ source: nodeIndex[riderId], target: nodeIndex[zoneId], type: 'OPERATES_IN', weight: 1.0, sourceId: riderId, targetId: zoneId });
    }
    // Also connect to claim zones
    r.behavioralBaseline.topClaimZones.forEach(z => {
      const czId = `zone:${z}`;
      if (nodeIndex[czId] !== undefined && z !== r.zoneId) {
        edges.push({ source: nodeIndex[riderId], target: nodeIndex[czId], type: 'CLAIMS_FROM', weight: 0.7, sourceId: riderId, targetId: czId });
      }
    });
  });

  // FILED_CLAIM: rider → claim
  riders.forEach(r => {
    r.claimHistory.forEach(c => {
      const riderId = `rider:${r.id}`;
      const claimId = `claim:${c.id}`;
      if (nodeIndex[riderId] !== undefined && nodeIndex[claimId] !== undefined) {
        edges.push({ source: nodeIndex[riderId], target: nodeIndex[claimId], type: 'FILED_CLAIM', weight: 1.0, sourceId: riderId, targetId: claimId });
      }
    });
  });

  // CLAIMED_AT: claim → timeslot
  riders.forEach(r => {
    r.claimHistory.forEach(c => {
      const claimId = `claim:${c.id}`;
      const hour = parseInt(c.time?.split(':')[0] || '12');
      const tsId = `timeslot:${hour}`;
      if (nodeIndex[claimId] !== undefined && nodeIndex[tsId] !== undefined) {
        edges.push({ source: nodeIndex[claimId], target: nodeIndex[tsId], type: 'CLAIMED_AT', weight: 1.0, sourceId: claimId, targetId: tsId });
      }
    });
  });

  // CO_TEMPORAL: riders who claim at the same time on the same day
  const claimsByDateHour = {};
  riders.forEach(r => {
    r.claimHistory.forEach(c => {
      const key = `${c.date}:${c.time?.split(':')[0]}`;
      if (!claimsByDateHour[key]) claimsByDateHour[key] = [];
      claimsByDateHour[key].push({ riderId: r.id, claimId: c.id });
    });
  });
  Object.values(claimsByDateHour).filter(g => g.length >= 2).forEach(group => {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = `rider:${group[i].riderId}`;
        const b = `rider:${group[j].riderId}`;
        if (nodeIndex[a] !== undefined && nodeIndex[b] !== undefined) {
          edges.push({ source: nodeIndex[a], target: nodeIndex[b], type: 'CO_TEMPORAL', weight: 0.9, sourceId: a, targetId: b, suspicious: true });
        }
      }
    }
  });

  // SIMILAR_PATTERN: riders with similar behavioral profiles
  for (let i = 0; i < riders.length; i++) {
    for (let j = i + 1; j < riders.length; j++) {
      const sim = computeBehavioralSimilarity(riders[i], riders[j]);
      if (sim > 0.7) {
        const a = `rider:${riders[i].id}`;
        const b = `rider:${riders[j].id}`;
        edges.push({ source: nodeIndex[a], target: nodeIndex[b], type: 'SIMILAR_PATTERN', weight: sim, sourceId: a, targetId: b, suspicious: sim > 0.85 });
      }
    }
  }

  return { nodes, edges, nodeIndex, stats: { nodeCount: nodes.length, edgeCount: edges.length, nodeTypes: { rider: riders.length, zone: zones.length, claim: riders.reduce((s, r) => s + r.claimHistory.length, 0), timeslot: 24 }, edgeTypes: countEdgeTypes(edges) } };
}

function countEdgeTypes(edges) {
  const counts = {};
  edges.forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1; });
  return counts;
}

// ======================== FEATURE NORMALIZATION ========================

function normalizeRiderFeatures(rider) {
  return [
    rider.trustScore / 100,
    Math.min(1, rider.joinedWeeksAgo / 52),
    Math.min(1, rider.avgDeliveriesPerDay / 30),
    Math.min(1, rider.claimHistory.length / 10),
    rider.behavioralBaseline.avgClaimsPerMonth / 5,
    rider.behavioralBaseline.avgClaimAmount / 200,
    Math.min(1, rider.behavioralBaseline.topClaimZones.length / 5),
    1 / (1 + rider.behavioralBaseline.avgTimeBetweenClaims / 30),
  ];
}

function normalizeZoneFeatures(zone) {
  const rp = zone.riskProfile;
  return [
    rp.waterlogging.frequency,
    rp.heatwave.frequency,
    rp.trafficParalysis.frequency,
    rp.upiOutage.frequency,
    rp.rwaBan.frequency,
    zone.historicalClaimRate,
    Math.min(1, zone.riderDensity / 400),
    zone.monsoonMultiplier / 2,
  ];
}

function normalizeClaimFeatures(claim) {
  return [
    claim.amount / 200,
    claim.status === 'auto-approved' ? 0 : claim.status === 'flagged' ? 0.8 : claim.status === 'rejected' ? 1.0 : 0.4,
    (claim.fraudScore || 0) / 100,
    claim.type === 'waterlogging' ? 1 : 0,
    claim.type === 'upi_outage' ? 1 : 0,
    claim.type === 'traffic_paralysis' ? 1 : 0,
    claim.type === 'heatwave' ? 1 : 0,
    claim.type === 'rwa_ban' || claim.type === 'festive_block' ? 1 : 0,
  ];
}

function computeBehavioralSimilarity(r1, r2) {
  const f1 = normalizeRiderFeatures(r1);
  const f2 = normalizeRiderFeatures(r2);
  // Cosine similarity
  let dot = 0, mag1 = 0, mag2 = 0;
  for (let i = 0; i < f1.length; i++) {
    dot += f1[i] * f2[i];
    mag1 += f1[i] * f1[i];
    mag2 += f2[i] * f2[i];
  }
  return mag1 === 0 || mag2 === 0 ? 0 : dot / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

// ======================== SAGE-STYLE MESSAGE PASSING ========================

/**
 * GraphSAGE-inspired message passing.
 * 3-layer neighborhood aggregation with mean pooling.
 * Each node's embedding is updated by aggregating neighbor embeddings.
 */
export function runMessagePassing(graph, numLayers = 3) {
  const { nodes, edges } = graph;
  const hiddenDim = 8;

  // Initialize embeddings from features
  nodes.forEach(node => {
    node.embedding = [...node.features];
    // Pad to hiddenDim if needed
    while (node.embedding.length < hiddenDim) node.embedding.push(0);
    node.embedding = node.embedding.slice(0, hiddenDim);
  });

  // Build adjacency map
  const neighbors = {};
  nodes.forEach((_, i) => { neighbors[i] = []; });
  edges.forEach(e => {
    neighbors[e.source].push({ idx: e.target, weight: e.weight, type: e.type });
    neighbors[e.target].push({ idx: e.source, weight: e.weight, type: e.type }); // undirected
  });

  const layerEmbeddings = [nodes.map(n => [...n.embedding])];

  // Message passing layers
  for (let layer = 0; layer < numLayers; layer++) {
    const newEmbeddings = [];

    for (let i = 0; i < nodes.length; i++) {
      const selfEmb = nodes[i].embedding;
      const neighs = neighbors[i];

      if (neighs.length === 0) {
        newEmbeddings.push([...selfEmb]);
        continue;
      }

      // SAGE aggregation: MEAN of neighbor embeddings
      const aggEmb = new Array(hiddenDim).fill(0);
      let totalWeight = 0;

      neighs.forEach(n => {
        const nEmb = nodes[n.idx].embedding;
        const w = n.weight * (n.type === 'CO_TEMPORAL' || n.type === 'SIMILAR_PATTERN' ? 1.5 : 1.0);
        for (let d = 0; d < hiddenDim; d++) {
          aggEmb[d] += nEmb[d] * w;
        }
        totalWeight += w;
      });

      // Normalize
      if (totalWeight > 0) {
        for (let d = 0; d < hiddenDim; d++) aggEmb[d] /= totalWeight;
      }

      // Combine: CONCAT(self, agg) → linear → ReLU
      const combined = new Array(hiddenDim).fill(0);
      for (let d = 0; d < hiddenDim; d++) {
        const raw = 0.6 * selfEmb[d] + 0.4 * aggEmb[d]; // Learned weight simulation
        combined[d] = Math.max(0, raw); // ReLU activation
      }

      // L2 normalize
      const norm = Math.sqrt(combined.reduce((s, v) => s + v * v, 0)) || 1;
      newEmbeddings.push(combined.map(v => v / norm));
    }

    // Update embeddings
    newEmbeddings.forEach((emb, i) => { nodes[i].embedding = emb; });
    layerEmbeddings.push(newEmbeddings.map(e => [...e]));
  }

  return { graph, layerEmbeddings, layers: numLayers };
}

// ======================== ANOMALY DETECTION ========================

/**
 * Detect anomalous nodes by computing distance from cluster centroids.
 * Fraudulent nodes will have higher anomaly scores.
 */
export function detectGraphAnomalies(graph) {
  const riderNodes = graph.nodes.filter(n => n.type === 'rider');

  // Compute centroid of all rider embeddings
  const dim = riderNodes[0]?.embedding?.length || 8;
  const centroid = new Array(dim).fill(0);
  riderNodes.forEach(n => {
    n.embedding.forEach((v, i) => { centroid[i] += v; });
  });
  centroid.forEach((_, i) => { centroid[i] /= riderNodes.length || 1; });

  // Compute anomaly scores (Euclidean distance from centroid)
  const anomalies = riderNodes.map(node => {
    let dist = 0;
    node.embedding.forEach((v, i) => {
      dist += Math.pow(v - centroid[i], 2);
    });
    dist = Math.sqrt(dist);

    // Count suspicious edges
    const suspEdges = graph.edges.filter(e =>
      (e.sourceId === node.id || e.targetId === node.id) && e.suspicious
    );

    // Composite anomaly score
    const anomalyScore = Math.min(100, Math.round(
      dist * 80 + suspEdges.length * 12 + (1 - node.features[0]) * 20 // trustScore inverse
    ));

    return {
      nodeId: node.id,
      riderId: node.id.replace('rider:', ''),
      label: node.label,
      embedding: node.embedding,
      distanceFromCentroid: Math.round(dist * 1000) / 1000,
      suspiciousEdgeCount: suspEdges.length,
      anomalyScore,
      riskLevel: anomalyScore > 60 ? 'critical' : anomalyScore > 40 ? 'high' : anomalyScore > 20 ? 'elevated' : 'low',
      neighborhoodInfo: {
        totalNeighbors: graph.edges.filter(e => e.sourceId === node.id || e.targetId === node.id).length,
        coTemporalLinks: graph.edges.filter(e => (e.sourceId === node.id || e.targetId === node.id) && e.type === 'CO_TEMPORAL').length,
        similarPatternLinks: graph.edges.filter(e => (e.sourceId === node.id || e.targetId === node.id) && e.type === 'SIMILAR_PATTERN').length,
      }
    };
  });

  anomalies.sort((a, b) => b.anomalyScore - a.anomalyScore);
  return anomalies;
}

/**
 * Detect fraud communities using graph clustering.
 * Identifies tightly connected subgraphs of suspicious riders.
 */
export function detectFraudCommunities(graph) {
  const suspEdges = graph.edges.filter(e => e.suspicious && (e.sourceId?.startsWith('rider:') || e.targetId?.startsWith('rider:')));
  if (suspEdges.length === 0) return [];

  // Union-Find
  const parent = {};
  const riderNodes = graph.nodes.filter(n => n.type === 'rider');
  riderNodes.forEach(n => { parent[n.idx] = n.idx; });
  const find = x => { if (parent[x] !== x) parent[x] = find(parent[x]); return parent[x]; };

  suspEdges.forEach(e => {
    if (parent[e.source] !== undefined && parent[e.target] !== undefined) {
      parent[find(e.source)] = find(e.target);
    }
  });

  const clusters = {};
  riderNodes.forEach(n => {
    const root = find(n.idx);
    if (!clusters[root]) clusters[root] = [];
    clusters[root].push(n);
  });

  return Object.values(clusters)
    .filter(c => c.length >= 2)
    .map((members, i) => ({
      id: `GNN-RING-${i + 1}`,
      size: members.length,
      members: members.map(m => ({ nodeId: m.id, label: m.label, trustScore: m.metadata.trustScore })),
      avgTrustScore: Math.round(members.reduce((s, m) => s + m.metadata.trustScore, 0) / members.length),
      internalEdges: suspEdges.filter(e => members.some(m => m.idx === e.source) && members.some(m => m.idx === e.target)).length,
      riskLevel: members.length >= 3 ? 'critical' : 'high',
      edgeTypes: [...new Set(suspEdges.filter(e => members.some(m => m.idx === e.source) || members.some(m => m.idx === e.target)).map(e => e.type))]
    }));
}

/**
 * Full GNN pipeline: build graph → message passing → anomaly detection.
 */
export function runGNNFraudDetection(riders = RIDERS, zones = ZONES) {
  const graph = buildFraudGraph(riders, zones);
  const result = runMessagePassing(graph);
  const anomalies = detectGraphAnomalies(result.graph);
  const communities = detectFraudCommunities(result.graph);

  return {
    graph: result.graph,
    layerEmbeddings: result.layerEmbeddings,
    messagePassingLayers: result.layers,
    anomalies,
    communities,
    stats: {
      ...result.graph.stats,
      anomaliesDetected: anomalies.filter(a => a.riskLevel === 'critical' || a.riskLevel === 'high').length,
      communitiesDetected: communities.length,
    }
  };
}
