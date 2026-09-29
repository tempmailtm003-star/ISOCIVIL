// High-fidelity road routing and waypoint generator for emergency response vehicles
// Features: Real-world Chennai arterial street graph, turn-by-turn routing, curved junction smoothing, and OSRM integration

import { calculateBearing } from './tacticalUtils';

// In-memory cache for computed road routes
const routeCache = new Map<string, [number, number][]>();

/**
 * Subdivide a list of key turn waypoints into dense, uniform step points (~10-15m each).
 * This ensures silky smooth continuous motion along curves and turns without coordinate jumps.
 */
export function subdividePath(
  waypoints: [number, number][],
  stepDistanceDeg: number = 0.00012
): [number, number][] {
  if (waypoints.length < 2) return waypoints;
  const result: [number, number][] = [];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const p1 = waypoints[i];
    const p2 = waypoints[i + 1];
    const dist = Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
    const steps = Math.max(1, Math.round(dist / stepDistanceDeg));

    for (let s = 0; s < steps; s++) {
      const frac = s / steps;
      result.push([
        Number((p1[0] + (p2[0] - p1[0]) * frac).toFixed(6)),
        Number((p1[1] + (p2[1] - p1[1]) * frac).toFixed(6))
      ]);
    }
  }

  const last = waypoints[waypoints.length - 1];
  result.push([Number(last[0].toFixed(6)), Number(last[1].toFixed(6))]);
  return result;
}

// Key Chennai road network vertices (Intersections, flyovers, and major arterial junctions)
interface RoadNode {
  id: string;
  coords: [number, number]; // [lat, lng]
}

const CHENNAI_ROAD_NODES: Record<string, [number, number]> = {
  // Central & North Arteries
  CENTRAL_STN: [13.0827, 80.2750],
  KILPAUK_E: [13.0805, 80.2470],
  CENTRAL_FIRE_BASE: [13.0890, 80.2320],
  KMC_KILPAUK: [13.0818, 80.2395],
  CHETPET_JCT: [13.0765, 80.2315],
  AMINJIKARAI: [13.0715, 80.2185],
  ANNA_NAGAR_BASE: [13.0910, 80.2150],
  ANNA_NAGAR_ROUNDTANA: [13.0850, 80.2120],
  THIRUMANGALAM: [13.0850, 80.1980],
  KOYAMBEDU_CMBT: [13.0694, 80.1948],
  MADURAVOYAL_FLYOVER: [13.0650, 80.1600],
  POONAMALLEE_BYPASS: [13.0480, 80.1000],
  AMBATTUR_IND_POST: [13.1143, 80.1548],
  AVADI_CORRIDOR: [13.1180, 80.1000],

  // Central / Mount Road Arteries (Anna Salai)
  GOVT_ESTATE: [13.0720, 80.2720],
  SPENCER_PLAZA: [13.0625, 80.2630],
  GEMINI_FLYOVER: [13.0530, 80.2505],
  STERLING_RD: [13.0660, 80.2360],
  VALLUVAR_KOTTAM: [13.0580, 80.2400],
  TEYNAMPET_DMS: [13.0420, 80.2440],
  NANDANAM_JCT: [13.0305, 80.2380],
  SAIDAPET_BRIDGE: [13.0200, 80.2240],
  GUINDY_KATHIPARA: [13.0067, 80.2030],

  // Inner Ring Road (100 Feet Road) & Arcot Road
  VADAPALANI_JCT: [13.0500, 80.2120],
  ASHOK_PILLAR: [13.0360, 80.2130],
  EKKATTUTHANGAL: [13.0220, 80.2080],
  PORUR_JCT: [13.0350, 80.1550],

  // Sardar Patel Road & Adyar
  LITTLE_MOUNT: [13.0110, 80.2230],
  IIT_MADRAS_GATE: [13.0090, 80.2380],
  MADHYA_KAILASH: [13.0060, 80.2540],
  ADYAR_TRAUMA: [13.0012, 80.2565],
  MYLAPORE_STN: [13.0332, 80.2678],
  MARINA_BEACH: [13.0500, 80.2820],
  SANTHOME_RD: [13.0330, 80.2780],

  // OMR (Rajiv Gandhi IT Expressway)
  TARAMANI_ASCENDAS: [12.9860, 80.2430],
  PERUNGUDI_SRP: [12.9650, 80.2410],
  THORAIPAKKAM_OMR: [12.9400, 80.2360],
  KARAPAKKAM_OMR: [12.9190, 80.2320],
  SHOLINGANALLUR_JCT: [12.9038, 80.2285],
  NAVALUR_OMR: [12.8460, 80.2260],
  SIRUSERI_SIPCOT: [12.8280, 80.2240],

  // GST Road (NH 45) & South
  AIRPORT_MEENAMBAKKAM: [12.9850, 80.1700],
  PALLAVARAM_GST: [12.9675, 80.1491],
  CHROMEPET_MIT: [12.9516, 80.1462],
  TAMBARAM_MEPZ: [12.9249, 80.1000],

  // 200 Feet Radial Roads & Velachery Corridors
  VELACHERY_VIJAYANAGAR: [12.9720, 80.2200],
  KEELKATTALAI_JCT: [12.9580, 80.1800],
  EACHANGADU_RADIAL: [12.9490, 80.2000],
  MEDAVAKKAM_KOOT_RD: [12.9180, 80.1910],
  PERUMBAKKAM: [12.9100, 80.2080],

  // ECR (East Coast Road)
  THIRUVANMIYUR_ECR: [12.9830, 80.2600],
  PALAVAKKAM_ECR: [12.9500, 80.2570],
  NEELANKARAI_ECR: [12.9350, 80.2550],
  AKKARAI_ECR: [12.9000, 80.2490]
};

// Road Segments with intermediate curve waypoints
interface RoadEdge {
  u: string;
  v: string;
  waypoints: [number, number][]; // includes u and v plus genuine road bends
  lengthKm: number;
}

function calculatePathDistance(pts: [number, number][]): number {
  let d = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const dLat = (pts[i + 1][0] - pts[i][0]) * 111.0;
    const dLng = (pts[i + 1][1] - pts[i][1]) * (111.0 * Math.cos((pts[i][0] * Math.PI) / 180));
    d += Math.sqrt(dLat * dLat + dLng * dLng);
  }
  return d;
}

const RAW_EDGES: [string, string, [number, number][]?][] = [
  // Poonamallee High Road Corridor (Central -> Kilpauk -> Chetpet -> Aminjikarai -> Koyambedu)
  ['CENTRAL_STN', 'KILPAUK_E', [[13.0827, 80.2750], [13.0835, 80.2640], [13.0805, 80.2470]]],
  ['KILPAUK_E', 'KMC_KILPAUK', [[13.0805, 80.2470], [13.0818, 80.2395]]],
  ['KMC_KILPAUK', 'CENTRAL_FIRE_BASE', [[13.0818, 80.2395], [13.0850, 80.2350], [13.0890, 80.2320]]],
  ['KMC_KILPAUK', 'CHETPET_JCT', [[13.0818, 80.2395], [13.0780, 80.2340], [13.0765, 80.2315]]],
  ['CENTRAL_FIRE_BASE', 'CHETPET_JCT', [[13.0890, 80.2320], [13.0820, 80.2320], [13.0765, 80.2315]]],
  ['CHETPET_JCT', 'AMINJIKARAI', [[13.0765, 80.2315], [13.0730, 80.2250], [13.0715, 80.2185]]],
  ['AMINJIKARAI', 'KOYAMBEDU_CMBT', [[13.0715, 80.2185], [13.0700, 80.2070], [13.0694, 80.1948]]],
  ['KOYAMBEDU_CMBT', 'MADURAVOYAL_FLYOVER', [[13.0694, 80.1948], [13.0670, 80.1780], [13.0650, 80.1600]]],
  ['MADURAVOYAL_FLYOVER', 'POONAMALLEE_BYPASS', [[13.0650, 80.1600], [13.0560, 80.1300], [13.0480, 80.1000]]],

  // Anna Nagar & Ambattur North-West Corridors
  ['ANNA_NAGAR_BASE', 'ANNA_NAGAR_ROUNDTANA', [[13.0910, 80.2150], [13.0850, 80.2120]]],
  ['ANNA_NAGAR_ROUNDTANA', 'THIRUMANGALAM', [[13.0850, 80.2120], [13.0850, 80.1980]]],
  ['THIRUMANGALAM', 'KOYAMBEDU_CMBT', [[13.0850, 80.1980], [13.0770, 80.1960], [13.0694, 80.1948]]],
  ['THIRUMANGALAM', 'AMBATTUR_IND_POST', [[13.0850, 80.1980], [13.0980, 80.1780], [13.1143, 80.1548]]],
  ['AMBATTUR_IND_POST', 'AVADI_CORRIDOR', [[13.1143, 80.1548], [13.1160, 80.1300], [13.1180, 80.1000]]],
  ['CENTRAL_FIRE_BASE', 'ANNA_NAGAR_BASE', [[13.0890, 80.2320], [13.0900, 80.2240], [13.0910, 80.2150]]],

  // Chetpet -> Nungambakkam -> Gemini Flyover
  ['CHETPET_JCT', 'STERLING_RD', [[13.0765, 80.2315], [13.0710, 80.2340], [13.0660, 80.2360]]],
  ['STERLING_RD', 'VALLUVAR_KOTTAM', [[13.0660, 80.2360], [13.0620, 80.2380], [13.0580, 80.2400]]],
  ['VALLUVAR_KOTTAM', 'GEMINI_FLYOVER', [[13.0580, 80.2400], [13.0550, 80.2460], [13.0530, 80.2505]]],

  // Anna Salai (Mount Road Corridor)
  ['CENTRAL_STN', 'GOVT_ESTATE', [[13.0827, 80.2750], [13.0770, 80.2740], [13.0720, 80.2720]]],
  ['GOVT_ESTATE', 'SPENCER_PLAZA', [[13.0720, 80.2720], [13.0670, 80.2670], [13.0625, 80.2630]]],
  ['SPENCER_PLAZA', 'GEMINI_FLYOVER', [[13.0625, 80.2630], [13.0570, 80.2560], [13.0530, 80.2505]]],
  ['GEMINI_FLYOVER', 'TEYNAMPET_DMS', [[13.0530, 80.2505], [13.0470, 80.2470], [13.0420, 80.2440]]],
  ['TEYNAMPET_DMS', 'NANDANAM_JCT', [[13.0420, 80.2440], [13.0360, 80.2410], [13.0305, 80.2380]]],
  ['NANDANAM_JCT', 'SAIDAPET_BRIDGE', [[13.0305, 80.2380], [13.0250, 80.2310], [13.0200, 80.2240]]],
  ['SAIDAPET_BRIDGE', 'GUINDY_KATHIPARA', [[13.0200, 80.2240], [13.0130, 80.2130], [13.0067, 80.2030]]],

  // Inner Ring Road (100 Feet Road: Koyambedu -> Vadapalani -> Ashok Pillar -> Kathipara)
  ['KOYAMBEDU_CMBT', 'VADAPALANI_JCT', [[13.0694, 80.1948], [13.0600, 80.2040], [13.0500, 80.2120]]],
  ['VADAPALANI_JCT', 'ASHOK_PILLAR', [[13.0500, 80.2120], [13.0430, 80.2125], [13.0360, 80.2130]]],
  ['ASHOK_PILLAR', 'EKKATTUTHANGAL', [[13.0360, 80.2130], [13.0290, 80.2100], [13.0220, 80.2080]]],
  ['EKKATTUTHANGAL', 'GUINDY_KATHIPARA', [[13.0220, 80.2080], [13.0140, 80.2050], [13.0067, 80.2030]]],
  ['VADAPALANI_JCT', 'PORUR_JCT', [[13.0500, 80.2120], [13.0420, 80.1800], [13.0350, 80.1550]]],
  ['PORUR_JCT', 'GUINDY_KATHIPARA', [[13.0350, 80.1550], [13.0200, 80.1750], [13.0067, 80.2030]]],

  // Sardar Patel Road (Kathipara -> Little Mount -> IIT Madras -> Madhya Kailash)
  ['GUINDY_KATHIPARA', 'LITTLE_MOUNT', [[13.0067, 80.2030], [13.0090, 80.2130], [13.0110, 80.2230]]],
  ['SAIDAPET_BRIDGE', 'LITTLE_MOUNT', [[13.0200, 80.2240], [13.0150, 80.2235], [13.0110, 80.2230]]],
  ['LITTLE_MOUNT', 'IIT_MADRAS_GATE', [[13.0110, 80.2230], [13.0100, 80.2310], [13.0090, 80.2380]]],
  ['IIT_MADRAS_GATE', 'MADHYA_KAILASH', [[13.0090, 80.2380], [13.0075, 80.2460], [13.0060, 80.2540]]],
  ['MADHYA_KAILASH', 'ADYAR_TRAUMA', [[13.0060, 80.2540], [13.0035, 80.2555], [13.0012, 80.2565]]],

  // Mylapore & Coastal Connectors
  ['GEMINI_FLYOVER', 'MYLAPORE_STN', [[13.0530, 80.2505], [13.0430, 80.2590], [13.0332, 80.2678]]],
  ['MYLAPORE_STN', 'SANTHOME_RD', [[13.0332, 80.2678], [13.0330, 80.2780]]],
  ['CENTRAL_STN', 'MARINA_BEACH', [[13.0827, 80.2750], [13.0650, 80.2850], [13.0500, 80.2820]]],
  ['MARINA_BEACH', 'SANTHOME_RD', [[13.0500, 80.2820], [13.0400, 80.2800], [13.0330, 80.2780]]],
  ['SANTHOME_RD', 'ADYAR_TRAUMA', [[13.0330, 80.2780], [13.0180, 80.2720], [13.0060, 80.2570], [13.0012, 80.2565]]],

  // OMR (Rajiv Gandhi IT Expressway: Madhya Kailash -> Taramani -> Perungudi -> Thoraipakkam -> Sholinganallur -> Siruseri)
  ['MADHYA_KAILASH', 'TARAMANI_ASCENDAS', [[13.0060, 80.2540], [12.9960, 80.2480], [12.9860, 80.2430]]],
  ['TARAMANI_ASCENDAS', 'PERUNGUDI_SRP', [[12.9860, 80.2430], [12.9750, 80.2420], [12.9650, 80.2410]]],
  ['PERUNGUDI_SRP', 'THORAIPAKKAM_OMR', [[12.9650, 80.2410], [12.9520, 80.2380], [12.9400, 80.2360]]],
  ['THORAIPAKKAM_OMR', 'KARAPAKKAM_OMR', [[12.9400, 80.2360], [12.9290, 80.2340], [12.9190, 80.2320]]],
  ['KARAPAKKAM_OMR', 'SHOLINGANALLUR_JCT', [[12.9190, 80.2320], [12.9110, 80.2300], [12.9038, 80.2285]]],
  ['SHOLINGANALLUR_JCT', 'NAVALUR_OMR', [[12.9038, 80.2285], [12.8750, 80.2270], [12.8460, 80.2260]]],
  ['NAVALUR_OMR', 'SIRUSERI_SIPCOT', [[12.8460, 80.2260], [12.8370, 80.2250], [12.8280, 80.2240]]],

  // GST Road (NH 45: Kathipara -> Airport -> Pallavaram -> Chromepet -> Tambaram)
  ['GUINDY_KATHIPARA', 'AIRPORT_MEENAMBAKKAM', [[13.0067, 80.2030], [12.9960, 80.1850], [12.9850, 80.1700]]],
  ['AIRPORT_MEENAMBAKKAM', 'PALLAVARAM_GST', [[12.9850, 80.1700], [12.9760, 80.1600], [12.9675, 80.1491]]],
  ['PALLAVARAM_GST', 'CHROMEPET_MIT', [[12.9675, 80.1491], [12.9600, 80.1475], [12.9516, 80.1462]]],
  ['CHROMEPET_MIT', 'TAMBARAM_MEPZ', [[12.9516, 80.1462], [12.9380, 80.1250], [12.9249, 80.1000]]],

  // Velachery & 200ft Radial Arteries (Guindy -> Velachery -> Radial Road -> Medavakkam -> Sholinganallur)
  ['LITTLE_MOUNT', 'VELACHERY_VIJAYANAGAR', [[13.0110, 80.2230], [12.9920, 80.2210], [12.9720, 80.2200]]],
  ['VELACHERY_VIJAYANAGAR', 'THORAIPAKKAM_OMR', [[12.9720, 80.2200], [12.9560, 80.2280], [12.9400, 80.2360]]],
  ['PALLAVARAM_GST', 'KEELKATTALAI_JCT', [[12.9675, 80.1491], [12.9620, 80.1650], [12.9580, 80.1800]]],
  ['KEELKATTALAI_JCT', 'EACHANGADU_RADIAL', [[12.9580, 80.1800], [12.9530, 80.1900], [12.9490, 80.2000]]],
  ['EACHANGADU_RADIAL', 'THORAIPAKKAM_OMR', [[12.9490, 80.2000], [12.9440, 80.2180], [12.9400, 80.2360]]],
  ['EACHANGADU_RADIAL', 'MEDAVAKKAM_KOOT_RD', [[12.9490, 80.2000], [12.9330, 80.1950], [12.9180, 80.1910]]],
  ['MEDAVAKKAM_KOOT_RD', 'PERUMBAKKAM', [[12.9180, 80.1910], [12.9140, 80.2000], [12.9100, 80.2080]]],
  ['PERUMBAKKAM', 'SHOLINGANALLUR_JCT', [[12.9100, 80.2080], [12.9070, 80.2180], [12.9038, 80.2285]]],

  // ECR (East Coast Road)
  ['ADYAR_TRAUMA', 'THIRUVANMIYUR_ECR', [[13.0012, 80.2565], [12.9920, 80.2580], [12.9830, 80.2600]]],
  ['THIRUVANMIYUR_ECR', 'PALAVAKKAM_ECR', [[12.9830, 80.2600], [12.9660, 80.2585], [12.9500, 80.2570]]],
  ['PALAVAKKAM_ECR', 'NEELANKARAI_ECR', [[12.9500, 80.2570], [12.9420, 80.2560], [12.9350, 80.2550]]],
  ['NEELANKARAI_ECR', 'AKKARAI_ECR', [[12.9350, 80.2550], [12.9170, 80.2520], [12.9000, 80.2490]]],
  ['SHOLINGANALLUR_JCT', 'AKKARAI_ECR', [[12.9038, 80.2285], [12.9020, 80.2390], [12.9000, 80.2490]]]
];

// Build adjacency list for Dijkstra graph navigation
interface AdjacencyEdge {
  target: string;
  waypoints: [number, number][];
  weight: number;
}

const ROAD_GRAPH: Map<string, AdjacencyEdge[]> = new Map();

// Initialize graph
Object.keys(CHENNAI_ROAD_NODES).forEach(nodeId => {
  ROAD_GRAPH.set(nodeId, []);
});

RAW_EDGES.forEach(([u, v, customPts]) => {
  const uCoords = CHENNAI_ROAD_NODES[u];
  const vCoords = CHENNAI_ROAD_NODES[v];
  if (!uCoords || !vCoords) return;

  const forwardPts: [number, number][] = customPts || [uCoords, vCoords];
  const reversePts: [number, number][] = [...forwardPts].reverse();
  const dist = calculatePathDistance(forwardPts);

  ROAD_GRAPH.get(u)?.push({ target: v, waypoints: forwardPts, weight: dist });
  ROAD_GRAPH.get(v)?.push({ target: u, waypoints: reversePts, weight: dist });
});

/**
 * Find the closest road network node to a given coordinate.
 */
function findNearestRoadNode(lat: number, lng: number): string {
  let closestId = 'CENTRAL_STN';
  let minDist = Infinity;

  Object.entries(CHENNAI_ROAD_NODES).forEach(([id, coords]) => {
    const d = Math.pow(coords[0] - lat, 2) + Math.pow(coords[1] - lng, 2);
    if (d < minDist) {
      minDist = d;
      closestId = id;
    }
  });

  return closestId;
}

/**
 * Dijkstra shortest path solver over the Chennai arterial street network
 */
function dijkstraRoadPath(startNodeId: string, endNodeId: string): [number, number][] {
  if (startNodeId === endNodeId) {
    return [CHENNAI_ROAD_NODES[startNodeId]];
  }

  const distances: Record<string, number> = {};
  const previous: Record<string, { node: string; waypoints: [number, number][] } | null> = {};
  const unvisited = new Set<string>();

  Object.keys(CHENNAI_ROAD_NODES).forEach(node => {
    distances[node] = Infinity;
    previous[node] = null;
    unvisited.add(node);
  });

  distances[startNodeId] = 0;

  while (unvisited.size > 0) {
    let current: string | null = null;
    let smallestDist = Infinity;

    unvisited.forEach(node => {
      if (distances[node] < smallestDist) {
        smallestDist = distances[node];
        current = node;
      }
    });

    if (!current || distances[current] === Infinity) break;
    if (current === endNodeId) break;

    unvisited.delete(current);

    const neighbors = ROAD_GRAPH.get(current) || [];
    for (const edge of neighbors) {
      if (!unvisited.has(edge.target)) continue;

      const alt = distances[current] + edge.weight;
      if (alt < distances[edge.target]) {
        distances[edge.target] = alt;
        previous[edge.target] = { node: current, waypoints: edge.waypoints };
      }
    }
  }

  // Reconstruct path
  const fullPath: [number, number][] = [];
  let curr: string | null = endNodeId;

  const edgesInReverse: [number, number][][] = [];
  while (curr && previous[curr]) {
    const prevEntry = previous[curr]!;
    edgesInReverse.push(prevEntry.waypoints);
    curr = prevEntry.node;
  }

  if (edgesInReverse.length === 0) {
    return [CHENNAI_ROAD_NODES[startNodeId], CHENNAI_ROAD_NODES[endNodeId]];
  }

  // Combine segments seamlessly
  edgesInReverse.reverse().forEach((seg, segIdx) => {
    if (segIdx === 0) {
      fullPath.push(...seg);
    } else {
      fullPath.push(...seg.slice(1));
    }
  });

  return fullPath;
}

/**
 * Generate a realistic road corridor connecting any start coordinate to any destination.
 * Attaches start and end coordinates seamlessly to the Chennai road network with turns.
 */
export function generateRoadWaypoints(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): [number, number][] {
  const cacheKey = `${startLat.toFixed(4)},${startLng.toFixed(4)}->${endLat.toFixed(4)},${endLng.toFixed(4)}`;
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  const nearestStart = findNearestRoadNode(startLat, startLng);
  const nearestEnd = findNearestRoadNode(endLat, endLng);

  const startNodeCoords = CHENNAI_ROAD_NODES[nearestStart];
  const endNodeCoords = CHENNAI_ROAD_NODES[nearestEnd];

  const graphPath = dijkstraRoadPath(nearestStart, nearestEnd);

  // Build complete road corridor: Start -> Start Avenue -> Road Network Corridors -> End Avenue -> Destination
  const fullRoute: [number, number][] = [];

  // 1. Initial segment from vehicle start to nearest street node (orthogonal street turn)
  if (Math.abs(startLat - startNodeCoords[0]) > 0.0003 || Math.abs(startLng - startNodeCoords[1]) > 0.0003) {
    fullRoute.push([startLat, startLng]);
    // Intermediate street corner turn
    fullRoute.push([startLat, startNodeCoords[1]]);
  }

  // 2. Main road network path with all real turns and junctions
  fullRoute.push(...graphPath);

  // 3. Final approach from last street node to incident location
  if (Math.abs(endLat - endNodeCoords[0]) > 0.0003 || Math.abs(endLng - endNodeCoords[1]) > 0.0003) {
    fullRoute.push([endNodeCoords[0], endLng]);
    fullRoute.push([endLat, endLng]);
  }

  // Deduplicate adjacent identical points
  const cleanRoute: [number, number][] = [];
  fullRoute.forEach(pt => {
    if (cleanRoute.length === 0) {
      cleanRoute.push(pt);
    } else {
      const prev = cleanRoute[cleanRoute.length - 1];
      if (Math.abs(prev[0] - pt[0]) > 0.00001 || Math.abs(prev[1] - pt[1]) > 0.00001) {
        cleanRoute.push(pt);
      }
    }
  });

  const subdivided = subdividePath(cleanRoute, 0.0001);
  routeCache.set(cacheKey, subdivided);
  return subdivided;
}

/**
 * Generate a closed perimeter patrol circuit around a base location.
 */
export function generatePatrolCircuit(
  baseLat: number,
  baseLng: number,
  radiusKm: number = 0.5
): [number, number][] {
  const latDelta = radiusKm / 111.0;
  const lngDelta = radiusKm / (111.0 * Math.cos((baseLat * Math.PI) / 180));

  const keyPoints: [number, number][] = [
    [baseLat, baseLng],
    [baseLat + latDelta * 0.75, baseLng + lngDelta * 0.25],
    [baseLat + latDelta * 0.70, baseLng + lngDelta * 0.90],
    [baseLat - latDelta * 0.20, baseLng + lngDelta * 0.85],
    [baseLat - latDelta * 0.75, baseLng + lngDelta * 0.20],
    [baseLat - latDelta * 0.55, baseLng - lngDelta * 0.65],
    [baseLat + latDelta * 0.20, baseLng - lngDelta * 0.75],
    [baseLat, baseLng]
  ];

  return subdividePath(keyPoints, 0.0001);
}

/**
 * Asynchronously fetch real road geometry from OpenStreetMap OSRM servers.
 * Automatically falls back to Chennai Road Network Graph if external server times out.
 */
export async function fetchOSRMRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<[number, number][]> {
  const cacheKey = `${startLat.toFixed(4)},${startLng.toFixed(4)}->${endLat.toFixed(4)},${endLng.toFixed(4)}`;
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  const endpoints = [
    `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
    `https://routing.openstreetmap.de/routed-car/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (
          data.routes &&
          data.routes[0] &&
          data.routes[0].geometry &&
          data.routes[0].geometry.coordinates
        ) {
          const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]]
          );
          if (coords.length >= 2) {
            const subdivided = subdividePath(coords, 0.0001);
            routeCache.set(cacheKey, subdivided);
            return subdivided;
          }
        }
      }
    } catch {
      // Continue to next endpoint or fallback
    }
  }

  // Reliable instant local graph routing fallback
  return generateRoadWaypoints(startLat, startLng, endLat, endLng);
}

/**
 * Find the closest index on a route to a given coordinate.
 */
export function findClosestWaypointIndex(
  route: [number, number][],
  lat: number,
  lng: number
): number {
  if (!route || route.length === 0) return 0;
  let minDistance = Infinity;
  let closestIdx = 0;

  for (let i = 0; i < route.length; i++) {
    const pt = route[i];
    const d = Math.pow(pt[0] - lat, 2) + Math.pow(pt[1] - lng, 2);
    if (d < minDistance) {
      minDistance = d;
      closestIdx = i;
    }
  }
  return closestIdx;
}
