const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const XML_PATH = path.join(__dirname, 'mapzones.xml');
const OUT_PATH = path.join(__dirname, 'mapzones.parsed.json');

// ---------------------------------------------------------------------------
// XML extraction with fast-xml-parser. The source XML mixes <Item> and
// <item> for ZoneAreas children (319 use lowercase, 21 use capital), so we
// normalize tag names to a single case before walking the tree.
// ---------------------------------------------------------------------------

const xml = fs.readFileSync(XML_PATH, 'utf8');

const parser = new XMLParser({
  ignoreAttributes: false,
  // Normalize tag case so <Item> and <item> collapse together. Then we
  // can reference everything by lowercase consistently.
  transformTagName: (name) => name.toLowerCase(),
  // Force ZoneAreas children and zone Items into arrays even when there's
  // only one — saves a "is it an array or an object?" check at every access.
  isArray: (name, jpath) => {
    return jpath === 'cmapzonescontainer.zones.item' || jpath.endsWith('.zoneareas.item');
  },
});

const doc = parser.parse(xml);
const rawItems = doc?.cmapzonescontainer?.zones?.item ?? [];

/**
 * Parse the inline content of a <ZoneAreaHull> element into Points.
 * Coordinates are whitespace-separated triples of floats; whitespace
 * between values is arbitrary (newlines, tabs, multiple spaces).
 */
function parseHull(text) {
  const numbers = String(text).trim().split(/\s+/).map(Number).filter((n) => !Number.isNaN(n));

  if (numbers.length % 3 !== 0) {
    throw new Error(`hull contains ${numbers.length} numbers, not a multiple of 3`);
  }

  const points = [];
  for (let i = 0; i < numbers.length; i += 3) {
    points.push({ x: numbers[i], y: numbers[i + 1], z: numbers[i + 2] });
  }
  return points;
}

/**
 * Pull the text content out of a ZoneAreaHull node. With ignoreAttributes:false
 * the text content lives in the special "#text" property; without attrs it's
 * just the value directly.
 */
function hullText(hullNode) {
  if (hullNode === null || hullNode === undefined) return '';
  if (typeof hullNode === 'string' || typeof hullNode === 'number') return String(hullNode);
  return hullNode['#text'] ?? '';
}

const items = rawItems.map((rawItem) => {
  const name = String(rawItem.name ?? '').trim();
  const type = String(rawItem.type ?? '').trim();

  const hullNodes = rawItem.zoneareas?.item ?? [];
  const hulls = [];
  for (const hullItem of hullNodes) {
    const hullNode = hullItem?.zoneareahull;
    if (!hullNode) continue;
    try {
      hulls.push(parseHull(hullText(hullNode)));
    } catch (err) {
      console.warn(`[${name}] skipping malformed hull: ${err.message}`);
    }
  }

  return { name, type, hulls };
});

console.log(`Parsed ${items.length} items from XML`);

// ---------------------------------------------------------------------------
// Boundary union — same edge-counting algorithm as zones.ts. An edge shared
// between two hulls of the same zone is interior; an edge in only one hull
// is on the outer ring.
// ---------------------------------------------------------------------------

const pointKey = (p) => `${p.x},${p.y},${p.z}`;
const edgeKey = (a, b) => {
  const ka = pointKey(a);
  const kb = pointKey(b);
  return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
};

/**
 * Build all outer boundary rings for a zone's hulls.
 *
 * Walks the multiset of boundary edges (those with edge-count === 1).
 * Each ring is one connected loop of boundary edges. Most zones produce
 * a single ring; zones with islands/holes/pinch points produce multiple.
 *
 * Algorithm walks **edges**, not vertices, so every edge is consumed
 * exactly once and cycles are unambiguous regardless of vertex degree.
 */
function buildOuterRings(hulls, zoneName) {
  const edgeCounts = new Map();
  const points = new Map();

  for (const hull of hulls) {
    for (let i = 0; i < hull.length; i++) {
      const a = hull[i];
      const b = hull[(i + 1) % hull.length];
      points.set(pointKey(a), a);
      points.set(pointKey(b), b);
      const k = edgeKey(a, b);
      edgeCounts.set(k, (edgeCounts.get(k) ?? 0) + 1);
    }
  }

  // For each boundary vertex, collect the set of boundary edges incident
  // to it. We'll consume edges from these sets as we walk.
  const incident = new Map(); // pointKey -> Set<edgeKey>
  const edgeEndpoints = new Map(); // edgeKey -> [pointKey, pointKey]

  for (const [eKey, count] of edgeCounts) {
    if (count !== 1) continue;
    const [ka, kb] = eKey.split('|');
    edgeEndpoints.set(eKey, [ka, kb]);
    if (!incident.has(ka)) incident.set(ka, new Set());
    if (!incident.has(kb)) incident.set(kb, new Set());
    incident.get(ka).add(eKey);
    incident.get(kb).add(eKey);
  }

  if (incident.size === 0) return [];

  // Topology check (informational only — we still try to walk).
  const oddDegree = [];
  for (const [k, edges] of incident) {
    if (edges.size !== 2) oddDegree.push({ key: k, degree: edges.size });
  }
  if (oddDegree.length > 0) {
    console.warn(
      `[${zoneName}] ${oddDegree.length} boundary vertices have non-2 degree (multi-ring or malformed input):`,
    );
    for (const v of oddDegree.slice(0, 5)) {
      console.warn(`  ${v.key} → degree ${v.degree}`);
    }
    if (oddDegree.length > 5) console.warn(`  ... and ${oddDegree.length - 5} more`);
  }

  const rings = [];
  const totalEdges = edgeEndpoints.size;
  let consumed = 0;

  // Keep starting new rings until every boundary edge has been consumed.
  while (consumed < totalEdges) {
    // Pick any vertex that still has an unused edge.
    let startKey;
    for (const [k, edges] of incident) {
      if (edges.size > 0) {
        startKey = k;
        break;
      }
    }
    if (!startKey) break;

    const ring = [points.get(startKey)];
    let currentKey = startKey;

    // Hard cap so a malformed input can never spin forever.
    const safetyCap = totalEdges + 1;
    let steps = 0;

    while (steps++ < safetyCap) {
      const edges = incident.get(currentKey);
      // Pull any remaining incident edge.
      const eKey = edges.values().next().value;
      if (eKey === undefined) break;

      const [ka, kb] = edgeEndpoints.get(eKey);
      const nextKey = ka === currentKey ? kb : ka;

      // Consume this edge from both endpoints so it isn't walked again.
      incident.get(ka).delete(eKey);
      incident.get(kb).delete(eKey);
      consumed++;

      if (nextKey === startKey) break; // closed the loop
      ring.push(points.get(nextKey));
      currentKey = nextKey;
    }

    if (ring.length >= 3) rings.push(ring);
  }

  return rings;
}

function signedArea(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return sum / 2;
}

// ---------------------------------------------------------------------------
// Build per-zone result records.
// ---------------------------------------------------------------------------

const results = items.map((item) => {
  const rings = buildOuterRings(item.hulls, item.name);

  // Match input convention (CCW relative to game map). The input hulls in
  // the XML are CCW; flip any ring our walk produced CW.
  for (const ring of rings) {
    if (signedArea(ring) < 0) ring.reverse();
  }

  // Sort rings largest-first by absolute area so the primary outline is
  // first. Holes/islands (if any) follow.
  rings.sort((a, b) => Math.abs(signedArea(b)) - Math.abs(signedArea(a)));

  return {
    name: item.name,
    type: item.type,
    hullCount: item.hulls.length,
    ringCount: rings.length,
    rings,
  };
});

// ---------------------------------------------------------------------------
// Output and summary.
// ---------------------------------------------------------------------------

fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 2));

const byType = new Map();
let emptyZones = 0;
let multiRingZones = 0;
for (const r of results) {
  byType.set(r.type, (byType.get(r.type) ?? 0) + 1);
  if (r.ringCount === 0) emptyZones++;
  if (r.ringCount > 1) multiRingZones++;
}

console.log('\nSummary:');
for (const [type, count] of [...byType.entries()].sort()) {
  console.log(`  ${type.padEnd(15)} ${count}`);
}
console.log(`\nZones with no boundary: ${emptyZones}`);
console.log(`Zones with multiple rings (islands/holes/pinches): ${multiRingZones}`);
if (multiRingZones > 0) {
  console.log('\nMulti-ring zones:');
  for (const r of results) {
    if (r.ringCount > 1) {
      const lengths = r.rings.map((ring) => ring.length).join(', ');
      console.log(`  ${r.name.padEnd(25)} ${r.ringCount} rings: [${lengths}]`);
    }
  }
}
console.log(`\nOutput written to ${OUT_PATH}`);
