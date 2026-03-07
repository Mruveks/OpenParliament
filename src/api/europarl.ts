/**
 * europarl.ts - European Parliament Open Data API client
 *
 * API base: https://data.europarl.europa.eu/api/v2
 * Docs: https://data.europarl.europa.eu/en/developer-corner/opendata-api
 *
 * HOW IT WORKS:
 * 1. Browser requests go to /api/ep/* (our Vite dev server)
 * 2. Vite proxy rewrites /api/ep -> /api/v2 and forwards to data.europarl.europa.eu
 * 3. API returns JSON-LD format (RDF data serialized as JSON)
 *
 * JSON-LD RESPONSE FORMAT:
 * The API returns data wrapped in a JSON-LD envelope:
 * {
 *   "@context": { ... },     // namespace prefixes
 *   "@graph": [ ... ],       // array of data items (MEPs, documents, etc.)
 *   "totalItems": 720        // total count for pagination
 * }
 *
 * Each item in @graph can have values as:
 *   - Plain strings: "John"
 *   - URI references: { "@id": "http://data.europarl.europa.eu/person/123" }
 *   - Typed literals: { "@value": "1990-01-01", "@type": "xsd:date" }
 *
 * POLITICAL GROUP DETECTION:
 * The list endpoint (/meps, /meps/show-current) returns MEP objects where
 * hasMembership contains URI strings pointing to membership resources.
 * These URIs do NOT directly contain political group info.
 *
 * To resolve groups, we:
 * 1. Fetch /corporate-bodies to build a map: body-ID -> group abbreviation
 * 2. Parse hasMembership URIs and match against that map
 * 3. If that fails, brute-force scan the entire MEP JSON for group name mentions
 * 4. If >50% of MEPs are still NI, batch-fetch individual MEP details
 *    (the /meps/{id} endpoint returns "framed" JSON-LD with expanded memberships)
 */

import type { MEP, CorporateBody, VoteResult, Committee } from '../types';

// Vite proxy prefix - maps to https://data.europarl.europa.eu/api/v2
const BASE = '/api/ep';

// ============================================================================
// FETCH HELPER
// ============================================================================

/**
 * Fetch JSON-LD from the EP API via our Vite proxy.
 *
 * URL construction:
 *   new URL('/api/ep/meps', 'http://localhost:5173')
 *   -> 'http://localhost:5173/api/ep/meps?format=application/ld+json'
 *   -> Vite proxy rewrites to: https://data.europarl.europa.eu/api/v2/meps?format=...
 */
async function api(path: string, params: Record<string, string> = {}): Promise<Record<string, unknown>> {
  const url = new URL(path, window.location.origin);
  // The API requires format parameter to return JSON-LD
  url.searchParams.set('format', 'application/ld+json');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/ld+json' },
  });

  if (!res.ok) {
    throw new Error(`EP API ${res.status}: ${res.statusText} (${path})`);
  }

  return res.json();
}

// ============================================================================
// JSON-LD PARSING HELPERS
// ============================================================================

/**
 * Unwrap a JSON-LD value to a plain string.
 *
 * JSON-LD values can be:
 *   "some string"                     -> "some string"
 *   { "@id": "http://example.org" }   -> "http://example.org"
 *   { "@value": "2024-01-01" }        -> "2024-01-01"
 *   null / undefined                  -> ""
 */
function unwrap(val: unknown): string {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object') {
    const o = val as Record<string, unknown>;
    if (typeof o['@id'] === 'string') return o['@id'];
    if (typeof o['@value'] === 'string') return o['@value'];
    if (typeof o['value'] === 'string') return o['value'];
    if (typeof o['identifier'] === 'string') return o['identifier'];
  }
  return '';
}

/**
 * Extract the last segment of a URI.
 *   "http://data.europarl.europa.eu/person/12345" -> "12345"
 *   "http://data.europarl.europa.eu/org/EPP"      -> "EPP"
 */
function lastSegment(uri: string): string {
  if (!uri) return '';
  return uri.split('/').pop() || uri;
}

/**
 * Extract data items from a JSON-LD response envelope.
 *
 * The API wraps results differently depending on the endpoint:
 *   { "@graph": [...items...] }           -> items from @graph
 *   { "@graph": [{ member: [...] }] }     -> items from Collection wrapper
 *   { "data": [...] }                     -> items from data key
 */
function getItems(data: Record<string, unknown>, label?: string): Record<string, unknown>[] {
  if (label) {
    console.log(`[EP][${label}] keys:`, Object.keys(data));
  }

  // Most common: @graph array
  if (Array.isArray(data['@graph'])) {
    const graph = data['@graph'] as Record<string, unknown>[];

    if (label) {
      console.log(`[EP][${label}] @graph has ${graph.length} items`);
      if (graph[0]) console.log(`[EP][${label}] first item keys:`, Object.keys(graph[0]));
    }

    // Sometimes @graph[0] is a Collection wrapper - unwrap it
    if (graph.length === 1) {
      const first = graph[0];
      const type = String(first?.['@type'] || '');
      if (type.includes('Collection') || type.includes('PagedCollection')) {
        const members = (first['member'] || first['hasMember'] || first['items']) as unknown[];
        if (Array.isArray(members)) {
          if (label) console.log(`[EP][${label}] unwrapped Collection, ${members.length} members`);
          return members as Record<string, unknown>[];
        }
      }
    }

    // @graph may contain mixed types. Filter to only Person items (for MEP endpoints)
    const persons = graph.filter(item => {
      const t = String(item['@type'] || '');
      return t.includes('Person') || item['givenName'] || item['familyName'];
    });
    if (persons.length > 0) return persons;

    return graph;
  }

  // Fallbacks for alternative response structures
  for (const key of ['data', 'items', 'member', 'results']) {
    if (Array.isArray(data[key])) return data[key] as Record<string, unknown>[];
  }

  if (label) console.log(`[EP][${label}] WARNING: no items found in response`);
  return [];
}

/**
 * Extract total item count from JSON-LD response.
 * Used for pagination - tells us how many pages to fetch.
 */
function getTotal(data: Record<string, unknown>, fallback: number): number {
  // Top-level count
  for (const key of ['totalItems', 'total', 'hydra:totalItems']) {
    if (typeof data[key] === 'number') return data[key] as number;
  }
  // May be inside Collection wrapper in @graph[0]
  if (Array.isArray(data['@graph'])) {
    for (const item of data['@graph'] as Record<string, unknown>[]) {
      if (typeof item['totalItems'] === 'number') return item['totalItems'] as number;
    }
  }
  return fallback;
}

// ============================================================================
// COUNTRY CODE MAPPING
// ============================================================================

/** ISO 3166-1 alpha-3 to alpha-2. The API uses alpha-3 in citizenship URIs. */
const ISO3: Record<string, string> = {
  AUT: 'AT', BEL: 'BE', BGR: 'BG', HRV: 'HR', CYP: 'CY', CZE: 'CZ',
  DNK: 'DK', EST: 'EE', FIN: 'FI', FRA: 'FR', DEU: 'DE', GRC: 'GR',
  HUN: 'HU', IRL: 'IE', ITA: 'IT', LVA: 'LV', LTU: 'LT', LUX: 'LU',
  MLT: 'MT', NLD: 'NL', POL: 'PL', PRT: 'PT', ROU: 'RO', SVK: 'SK',
  SVN: 'SI', ESP: 'ES', SWE: 'SE',
};

/** Parse a citizenship URI to 2-letter country code.
 *  e.g. "http://publications.europa.eu/resource/authority/country/POL" -> "PL"
 */
function toCountryCode(val: unknown): string {
  const uri = unwrap(val);
  if (!uri) return '';
  const code = lastSegment(uri).toUpperCase();
  return ISO3[code] || (code.length === 2 ? code : code.substring(0, 2));
}

function toGender(val: unknown): string | undefined {
  const s = lastSegment(unwrap(val)).toUpperCase();
  if (s === 'MALE' || s === 'M') return 'male';
  if (s === 'FEMALE' || s === 'F') return 'female';
  return undefined;
}

// ============================================================================
// POLITICAL GROUP DEFINITIONS
// ============================================================================

/** All known EP political group abbreviations */
const GROUPS = new Set([
  'EPP', 'S&D', 'RE', 'Greens/EFA', 'ECR', 'The Left', 'GUE/NGL',
  'PfE', 'ID', 'NI', 'ESN',
]);

/**
 * Mapping: [abbreviation, searchPatterns[]]
 * Used to find group mentions in text/URIs.
 * Patterns are checked with String.includes().
 */
const GROUP_PATTERNS: [string, string[]][] = [
  ['EPP',        ['EPP', 'European People']],
  ['S&D',        ['S&D', 'S%26D', 'Socialists and Democrats', 'Progressive Alliance']],
  ['RE',         ['Renew Europe']],
  ['Greens/EFA', ['Greens/EFA', 'Greens%2FEFA', 'Verts/ALE', 'European Free Alliance']],
  ['ECR',        ['ECR', 'European Conservatives']],
  ['The Left',   ['The Left', 'GUE/NGL', 'GUE%2FNGL', 'European United Left']],
  ['PfE',        ['PfE', 'Patriots for Europe']],
  ['ID',         ['Identity and Democracy']],
  ['ESN',        ['ESN', 'Europe of Sovereign Nations']],
];

/** Full names for display */
export const GROUP_FULL: Record<string, string> = {
  'EPP': "European People's Party",
  'S&D': 'Progressive Alliance of Socialists and Democrats',
  'RE': 'Renew Europe',
  'Greens/EFA': 'Greens/European Free Alliance',
  'ECR': 'European Conservatives and Reformists',
  'The Left': 'The Left in the European Parliament',
  'GUE/NGL': 'European United Left/Nordic Green Left',
  'PfE': 'Patriots for Europe',
  'ID': 'Identity and Democracy',
  'NI': 'Non-Inscrits',
  'ESN': 'Europe of Sovereign Nations',
};

// ============================================================================
// CORPORATE BODY MAP (for resolving political groups from membership URIs)
// ============================================================================

/**
 * Cache: maps corporate body IDs and URIs to political group abbreviations.
 * Built once from /corporate-bodies endpoint, then cached for the session.
 *
 * Example entries:
 *   "1234"  -> "EPP"   (body ID)
 *   "EPP"   -> "EPP"   (notation)
 *   "http://data.europarl.europa.eu/org/1234" -> "EPP" (full URI)
 */
let _groupMap: Record<string, string> | null = null;

async function getGroupMap(): Promise<Record<string, string>> {
  if (_groupMap) return _groupMap;

  const map: Record<string, string> = {};

  // Seed with known abbreviations so they always match
  for (const g of GROUPS) map[g] = g;

  try {
    // Fetch all corporate bodies (political groups, committees, delegations, etc.)
    // We need this to map body IDs to political group abbreviations
    const data = await api(`${BASE}/corporate-bodies`, { offset: '0', limit: '300' });
    const items = getItems(data);

    for (const item of items) {
      const fullUri = unwrap(item['@id']);
      const id = lastSegment(fullUri);
      const notation = unwrap(item['notation']) || unwrap(item['skos:notation']);
      const label = unwrap(item['prefLabel']) || unwrap(item['label']);

      // Check if this body's notation is a known group
      if (notation && GROUPS.has(notation)) {
        map[id] = notation;
        map[notation] = notation;
        if (fullUri) map[fullUri] = notation;
        continue;
      }

      // Check if label contains a known group name
      for (const [abbrev, patterns] of GROUP_PATTERNS) {
        if (patterns.some(p => label.includes(p) || notation === abbrev)) {
          map[id] = abbrev;
          if (notation) map[notation] = abbrev;
          if (fullUri) map[fullUri] = abbrev;
          break;
        }
      }
    }

    console.log('[EP] Group map built:', Object.keys(map).length, 'entries');
  } catch (e) {
    console.warn('[EP] Failed to build group map:', e);
  }

  _groupMap = map;
  return map;
}

// ============================================================================
// POLITICAL GROUP DETECTION (3-tier approach)
// ============================================================================

/**
 * Try to find a political group abbreviation in a string.
 * Checks against all known patterns.
 */
function matchGroup(str: string): string | null {
  if (!str) return null;
  for (const [abbrev, patterns] of GROUP_PATTERNS) {
    for (const p of patterns) {
      if (str.includes(p)) return abbrev;
    }
  }
  // Also check if the string itself or its last segment is a known group
  if (GROUPS.has(str)) return str;
  const seg = lastSegment(str);
  if (GROUPS.has(seg)) return seg;
  return null;
}

/**
 * TIER 1: Parse hasMembership to find political group.
 *
 * hasMembership can be:
 *   - Array of URI strings: ["http://data.europarl.europa.eu/membership/123-m-456"]
 *   - Array of objects: [{ "@id": "...", "org:organization": { "@id": "...org/1234" } }]
 *   - Single string or object (not wrapped in array)
 *
 * We check every value at every level for group references.
 */
function findGroupInMemberships(memberships: unknown, groupMap: Record<string, string>): string | null {
  if (!memberships) return null;
  const list = Array.isArray(memberships) ? memberships : [memberships];

  for (const m of list) {
    // String membership URI
    if (typeof m === 'string') {
      const seg = lastSegment(m);
      if (groupMap[seg]) return groupMap[seg];
      if (groupMap[m]) return groupMap[m];
      const found = matchGroup(m);
      if (found) return found;
    }

    // Object membership
    if (m && typeof m === 'object') {
      const rec = m as Record<string, unknown>;

      // Scan every property value
      for (const key of Object.keys(rec)) {
        const val = rec[key];
        const str = unwrap(val);
        if (str) {
          const seg = lastSegment(str);
          if (groupMap[seg]) return groupMap[seg];
          if (groupMap[str]) return groupMap[str];
          const found = matchGroup(str);
          if (found) return found;
        }

        // Check nested objects (e.g. org:organization -> { "@id": "..." })
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          const nested = val as Record<string, unknown>;
          for (const nv of Object.values(nested)) {
            const s = unwrap(nv);
            if (!s) continue;
            const seg = lastSegment(s);
            if (groupMap[seg]) return groupMap[seg];
            if (groupMap[s]) return groupMap[s];
            const found = matchGroup(s);
            if (found) return found;
          }
        }
      }
    }
  }

  return null;
}

/**
 * TIER 2: Brute-force scan - stringify entire MEP object and search for
 * any mention of a political group name.
 *
 * This catches cases where group info is buried in unexpected fields.
 */
function findGroupBruteForce(data: Record<string, unknown>): string {
  const json = JSON.stringify(data);
  for (const [abbrev, patterns] of GROUP_PATTERNS) {
    for (const p of patterns) {
      if (json.includes(p)) return abbrev;
    }
  }
  return 'NI';
}

// ============================================================================
// MEP PARSING
// ============================================================================

/**
 * Parse a raw JSON-LD MEP object into our MEP type.
 *
 * Tries multiple field names for each property because the API uses
 * different names depending on the endpoint and serialization format:
 *   - /meps list: compact field names (givenName, familyName)
 *   - /meps/{id}: may use prefixed names (foaf:givenName)
 */
function parseMEP(raw: Record<string, unknown>, groupMap: Record<string, string>): MEP {
  const id = lastSegment(unwrap(raw['@id']) || unwrap(raw['identifier']));

  const label = unwrap(raw['label']) || unwrap(raw['prefLabel']);
  const firstName = unwrap(raw['givenName']) || unwrap(raw['foaf:givenName']);
  const lastName = unwrap(raw['familyName']) || unwrap(raw['foaf:familyName']);
  const fullName = label || `${firstName} ${lastName}`.trim() || `MEP ${id}`;

  const countryCode = toCountryCode(
    raw['citizenship'] || raw['representedCountry'] || raw['hasCountryName'] || raw['country']
  );

  // Political group detection (Tier 1 -> Tier 2)
  const memberships = raw['hasMembership'] || raw['membership'] || raw['inverse_hasMember'] || raw['memberOf'];
  let group = findGroupInMemberships(memberships, groupMap);
  if (!group) group = findGroupBruteForce(raw);

  return {
    id,
    identifier: id,
    fullName,
    firstName,
    lastName,
    country: '',
    countryCode,
    politicalGroup: GROUP_FULL[group] || group,
    politicalGroupShort: group,
    nationalParty: unwrap(raw['nationalPoliticalGroup']) || unwrap(raw['nationalParty']),
    photoUrl: unwrap(raw['img']) || unwrap(raw['image']) || unwrap(raw['foaf:img'])
      || `https://www.europarl.europa.eu/mepphoto/${id}.jpg`,
    active: true,
    gender: toGender(raw['gender'] || raw['hasGender']),
    dateOfBirth: unwrap(raw['dateOfBirth']) || undefined,
    placeOfBirth: unwrap(raw['placeOfBirth']) || undefined,
    committees: extractCommittees(memberships, groupMap),
  };
}

/**
 * Extract committee memberships from the hasMembership array.
 * Committees are corporate bodies with 2-5 uppercase letter notations
 * that are NOT political groups.
 */
function extractCommittees(memberships: unknown, groupMap: Record<string, string>): Committee[] | undefined {
  if (!memberships) return undefined;
  const list = Array.isArray(memberships) ? memberships : [memberships];
  const result: Committee[] = [];

  for (const m of list) {
    if (!m || typeof m !== 'object') continue;
    const rec = m as Record<string, unknown>;

    for (const field of ['organization', 'memberOf', 'hasCorporateBody', 'corporateBody']) {
      const orgUri = unwrap(rec[field]);
      if (!orgUri) continue;

      const notation = lastSegment(orgUri);
      // Skip political groups, only keep committees (2-5 uppercase letters)
      if (GROUPS.has(notation) || groupMap[notation]) continue;
      if (/^[A-Z]{2,5}$/.test(notation)) {
        result.push({
          id: notation,
          name: unwrap(rec['label']) || unwrap(rec['prefLabel']) || notation,
          shortName: notation,
          role: unwrap(rec['role']) || unwrap(rec['hasRole']) || 'Member',
          type: 'committee',
        });
      }
    }
  }

  return result.length > 0 ? result : undefined;
}

// ============================================================================
// PUBLIC API: MEPs
// ============================================================================

/**
 * Fetch one page of MEPs from the EP API.
 *
 * @param useCurrent - if true, uses /meps/show-current (only active MEPs for today)
 *                     instead of /meps (all MEPs including historical)
 */
export async function fetchMEPs(params: {
  offset?: number;
  limit?: number;
  countryCode?: string;
  useCurrent?: boolean;
} = {}): Promise<{ items: MEP[]; total: number }> {
  const qp: Record<string, string> = {
    offset: String(params.offset || 0),
    limit: String(params.limit || 50),
  };
  if (params.countryCode) qp['country-code'] = params.countryCode;

  // /meps/show-current returns only currently active MEPs
  // /meps returns all MEPs (including past terms)
  const endpoint = params.useCurrent ? `${BASE}/meps/show-current` : `${BASE}/meps`;

  // Fetch MEP data and group map in parallel (group map is cached after first call)
  const [data, groupMap] = await Promise.all([
    api(endpoint, qp),
    getGroupMap(),
  ]);

  const isFirst = (params.offset || 0) === 0;
  const rawItems = getItems(data, isFirst ? 'MEPs' : undefined);

  // Debug logging for first page to help diagnose parsing issues
  if (isFirst && rawItems.length > 0) {
    const sample = rawItems[0];
    console.log('[EP] Sample MEP keys:', Object.keys(sample));
    const ms = sample['hasMembership'];
    if (ms) {
      const first = Array.isArray(ms) ? ms[0] : ms;
      console.log('[EP] Sample membership:', typeof first === 'string'
        ? first
        : JSON.stringify(first).slice(0, 500));
    } else {
      console.log('[EP] No hasMembership on sample MEP!');
    }
  }

  const items = rawItems.map(item => parseMEP(item, groupMap));
  const total = getTotal(data, items.length);

  if (isFirst) {
    const ni = items.filter(m => m.politicalGroupShort === 'NI').length;
    console.log(`[EP] Page 0: ${items.length} MEPs, ${ni} NI, total=${total}`);
  }

  return { items, total };
}

/**
 * Fetch ALL MEPs with parallel pagination.
 *
 * Strategy:
 * 1. Fetch first page from /meps/show-current (current active MEPs)
 *    Falls back to /meps if show-current fails
 * 2. If more pages exist, fetch them all in parallel (batches of 5)
 * 3. If >50% are NI (group not detected), batch-fetch individual MEP details
 *    from /meps/{id} where the response includes expanded membership data
 */
export async function fetchAllMEPs(countryCode?: string): Promise<MEP[]> {
  const limit = 100;

  // Step 1: First page (try show-current, fallback to /meps)
  let first: { items: MEP[]; total: number };
  try {
    first = await fetchMEPs({ offset: 0, limit, countryCode, useCurrent: true });
    console.log('[EP] Using /meps/show-current');
  } catch {
    console.log('[EP] show-current failed, using /meps');
    first = await fetchMEPs({ offset: 0, limit, countryCode });
  }

  const all: MEP[] = [...first.items];
  const total = first.total;

  // Step 2: Fetch remaining pages in parallel (batches of 5 concurrent requests)
  if (all.length < total) {
    const offsets: number[] = [];
    for (let o = limit; o < total && o < 2000; o += limit) offsets.push(o);

    const BATCH = 5;
    for (let i = 0; i < offsets.length; i += BATCH) {
      const batch = offsets.slice(i, i + BATCH);
      const results = await Promise.all(
        batch.map(o =>
          fetchMEPs({ offset: o, limit, countryCode, useCurrent: true })
            .catch(() => fetchMEPs({ offset: o, limit, countryCode }))
        )
      );
      for (const r of results) all.push(...r.items);
    }
  }

  console.log(`[EP] Fetched ${all.length} MEPs total`);

  // Step 3: If most MEPs are NI, try enriching with individual detail endpoints
  const niCount = all.filter(m => m.politicalGroupShort === 'NI').length;
  if (niCount > all.length * 0.5 && all.length > 10) {
    console.log(`[EP] ${niCount}/${all.length} are NI, enriching with /meps/{id}...`);
    return enrichWithDetails(all);
  }

  return all;
}

/**
 * TIER 3: Batch-fetch individual MEP details for NI MEPs.
 *
 * The /meps/{id} endpoint returns "framed" JSON-LD where @graph contains
 * the Person object AND all related Membership/Organization objects.
 * This gives us much richer data to detect political groups.
 *
 * We fetch in batches of 20 concurrent requests to avoid overwhelming the API.
 */
async function enrichWithDetails(meps: MEP[]): Promise<MEP[]> {
  const result = [...meps];
  const niIndexes = meps.map((m, i) => m.politicalGroupShort === 'NI' ? i : -1).filter(i => i >= 0);
  let fixed = 0;

  const BATCH = 20;
  for (let i = 0; i < niIndexes.length; i += BATCH) {
    const batch = niIndexes.slice(i, i + BATCH);
    const responses = await Promise.allSettled(
      batch.map(idx => fetchMEPById(result[idx].id))
    );

    for (let j = 0; j < responses.length; j++) {
      const resp = responses[j];
      if (resp.status === 'fulfilled' && resp.value.politicalGroupShort !== 'NI') {
        const idx = batch[j];
        result[idx] = {
          ...result[idx],
          politicalGroup: resp.value.politicalGroup,
          politicalGroupShort: resp.value.politicalGroupShort,
          nationalParty: resp.value.nationalParty || result[idx].nationalParty,
          countryCode: resp.value.countryCode || result[idx].countryCode,
        };
        fixed++;
      }
    }
  }

  console.log(`[EP] Enriched ${fixed}/${niIndexes.length} MEPs`);
  return result;
}

/**
 * Fetch a single MEP by ID.
 * Returns framed JSON-LD with the Person + all related objects in @graph.
 */
export async function fetchMEPById(id: string): Promise<MEP> {
  const [data, groupMap] = await Promise.all([
    api(`${BASE}/meps/${id}`),
    getGroupMap(),
  ]);

  if (!Array.isArray(data['@graph'])) {
    return parseMEP(data, groupMap);
  }

  const graph = data['@graph'] as Record<string, unknown>[];

  // Find the Person object in @graph
  const person = graph.find(item => {
    const t = String(item['@type'] || '');
    return t.includes('Person') || item['givenName'] || item['familyName'];
  });

  if (!person) {
    return graph.length > 0 ? parseMEP(graph[0], groupMap) : parseMEP(data, groupMap);
  }

  const mep = parseMEP(person, groupMap);

  // If still NI, scan ALL @graph items for group mentions
  // (Membership and Organization objects alongside the Person)
  if (mep.politicalGroupShort === 'NI') {
    for (const item of graph) {
      if (String(item['@type'] || '').includes('Person')) continue;
      const json = JSON.stringify(item);
      for (const [abbrev, patterns] of GROUP_PATTERNS) {
        if (patterns.some(p => json.includes(p))) {
          return { ...mep, politicalGroupShort: abbrev, politicalGroup: GROUP_FULL[abbrev] || abbrev };
        }
      }
    }
  }

  return mep;
}

export async function fetchMEPsByCountry(countryCode: string): Promise<MEP[]> {
  return fetchAllMEPs(countryCode);
}

// ============================================================================
// PUBLIC API: CORPORATE BODIES & COMMITTEES
// ============================================================================

/**
 * Fetch EP corporate bodies (political groups, committees, delegations, etc.)
 * Used for the committee list and for building the group map.
 */
export async function fetchCorporateBodies(params: {
  offset?: number;
  limit?: number;
  type?: string;
} = {}): Promise<CorporateBody[]> {
  const qp: Record<string, string> = {
    offset: String(params.offset || 0),
    limit: String(params.limit || 100),
  };
  if (params.type) qp['type'] = params.type;

  const data = await api(`${BASE}/corporate-bodies`, qp);
  return getItems(data).map(item => ({
    id: lastSegment(unwrap(item['@id'])),
    notation: unwrap(item['notation']) || unwrap(item['skos:notation']),
    prefLabel: unwrap(item['prefLabel']) || unwrap(item['label']),
    type: unwrap(item['@type']) || unwrap(item['classification']),
    classification: unwrap(item['classification']),
  }));
}

/**
 * Fetch EP committees.
 * Tries fetching with type=COMMITTEE filter first, falls back to filtering by notation pattern.
 */
export async function fetchCommittees(): Promise<Committee[]> {
  let bodies: CorporateBody[] = [];

  try {
    bodies = await fetchCorporateBodies({ limit: 200, type: 'COMMITTEE' });
  } catch { /* ignore */ }

  // Fallback: fetch all and filter to committee-like bodies
  if (bodies.length === 0) {
    const all = await fetchCorporateBodies({ limit: 300 });
    bodies = all.filter(b => {
      const t = `${b.type} ${b.classification}`.toLowerCase();
      return t.includes('committee') || t.includes('com_') ||
        (b.notation && /^[A-Z]{2,5}$/.test(b.notation) && !GROUPS.has(b.notation));
    });
  }

  return bodies.map(b => ({
    id: b.id,
    name: b.prefLabel || b.notation || b.id,
    shortName: b.notation || b.id,
    role: '',
    type: 'committee' as const,
  }));
}

// ============================================================================
// PUBLIC API: PLENARY DOCUMENTS (voting/legislation)
// ============================================================================

/**
 * Fetch plenary documents from /plenary-documents.
 * These are document metadata - the EP API does not include vote counts
 * on this endpoint. Vote results are available under /meetings/{id}/vote-results.
 *
 * Results are sorted by date (newest first).
 */
export async function fetchPlenaryDocuments(params: {
  offset?: number;
  limit?: number;
  year?: string;
} = {}): Promise<VoteResult[]> {
  const qp: Record<string, string> = {
    offset: String(params.offset || 0),
    limit: String(params.limit || 50),
  };
  if (params.year) qp['year'] = params.year;

  const data = await api(`${BASE}/plenary-documents`, qp);
  const items = getItems(data);

  return items.map(item => {
    const title = unwrap(item['title_dcterms']) || unwrap(item['dcterms:title'])
      || unwrap(item['title']) || unwrap(item['prefLabel']) || unwrap(item['label']);
    const ref = unwrap(item['reference']) || unwrap(item['notation']) || unwrap(item['epvoc:reference']);
    const date = unwrap(item['date']) || unwrap(item['created'])
      || unwrap(item['dcterms:date']) || unwrap(item['dateDocument']);

    const displayTitle = title || ref || lastSegment(unwrap(item['@id']));

    return {
      id: lastSegment(unwrap(item['@id'])),
      title: displayTitle,
      date,
      documentRef: ref !== displayTitle ? ref : undefined,
      // Plenary documents endpoint does NOT include vote counts
      totalFor: 0,
      totalAgainst: 0,
      totalAbstention: 0,
      subject: unwrap(item['subject']) || undefined,
      description: unwrap(item['description']) || undefined,
    };
  }).sort((a, b) => {
    // Newest first
    if (a.date && b.date) return b.date.localeCompare(a.date);
    return a.date ? -1 : b.date ? 1 : 0;
  });
}

// ============================================================================
// PUBLIC API: MEETINGS
// ============================================================================

/**
 * Fetch EP meetings (plenary sessions).
 */
export async function fetchMeetings(params: {
  offset?: number;
  limit?: number;
} = {}) {
  const qp: Record<string, string> = {
    offset: String(params.offset || 0),
    limit: String(params.limit || 50),
  };

  const data = await api(`${BASE}/meetings`, qp);
  return getItems(data).map(item => ({
    id: lastSegment(unwrap(item['@id'])),
    date: unwrap(item['date']) || unwrap(item['startDate']),
    type: unwrap(item['@type']),
    label: unwrap(item['label']) || unwrap(item['prefLabel']),
  }));
}
