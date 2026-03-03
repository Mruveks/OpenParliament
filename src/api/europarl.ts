import type { MEP, CorporateBody, VoteResult, Committee } from '../types';

const BASE_URL = '/api/ep';

// ─── Fetch helper ───────────────────────────────────────────────

async function fetchJSON(path: string, params: Record<string, string> = {}) {
  const url = new URL(path, window.location.origin);
  url.searchParams.set('format', 'application/ld+json');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/ld+json' },
  });

  if (!res.ok) {
    throw new Error(`EP API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// ─── JSON-LD helpers ────────────────────────────────────────────

/** Unwrap a JSON-LD value that might be { "@id": "..." } or a plain string */
function unwrapUri(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    if (typeof obj['@id'] === 'string') return obj['@id'];
    if (typeof obj['@value'] === 'string') return obj['@value'];
    if (typeof obj['identifier'] === 'string') return obj['identifier'];
    if (typeof obj['id'] === 'string') return obj['id'];
  }
  return '';
}

/** Unwrap a JSON-LD value that might be { "@value": "..." } or a plain string */
function unwrapLiteral(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    if (typeof obj['@value'] === 'string') return obj['@value'];
    if (typeof obj['value'] === 'string') return obj['value'];
  }
  return '';
}

/** Extract items from various JSON-LD response envelope formats */
function extractGraph(data: Record<string, unknown>): Record<string, unknown>[] {
  // Direct @graph array
  if (Array.isArray(data['@graph'])) {
    const graph = data['@graph'] as Record<string, unknown>[];
    // Check if @graph[0] is a Collection wrapper containing the actual items
    if (
      graph.length === 1 &&
      typeof graph[0] === 'object' &&
      graph[0] !== null
    ) {
      const first = graph[0] as Record<string, unknown>;
      const typeStr = String(first['@type'] || '');
      if (typeStr.includes('Collection') || typeStr.includes('PagedCollection')) {
        const members =
          first['member'] || first['hasMember'] || first['items'] || first['hydra:member'];
        if (Array.isArray(members)) return members as Record<string, unknown>[];
      }
    }
    // Filter to only person-type items if the graph also contains other types
    const persons = graph.filter((item) => {
      const t = String(item['@type'] || '');
      return t.includes('Person') || item['givenName'] || item['familyName'];
    });
    if (persons.length > 0) return persons;
    return graph;
  }

  // Other common envelopes
  if (Array.isArray(data['data'])) return data['data'] as Record<string, unknown>[];
  if (Array.isArray(data['items'])) return data['items'] as Record<string, unknown>[];
  if (Array.isArray(data['member'])) return data['member'] as Record<string, unknown>[];
  if (Array.isArray(data['results'])) return data['results'] as Record<string, unknown>[];

  return [];
}

/** Extract total item count from various JSON-LD response formats */
function extractTotal(data: Record<string, unknown>, fallback: number): number {
  if (typeof data['totalItems'] === 'number') return data['totalItems'];
  if (typeof data['total'] === 'number') return data['total'];
  if (typeof data['hydra:totalItems'] === 'number') return data['hydra:totalItems'];

  // Might be inside @graph[0] Collection
  if (Array.isArray(data['@graph'])) {
    const graph = data['@graph'] as Record<string, unknown>[];
    for (const item of graph) {
      if (typeof item['totalItems'] === 'number') return item['totalItems'];
      if (typeof item['hydra:totalItems'] === 'number') return item['hydra:totalItems'];
    }
  }

  return fallback;
}

// ─── ID / code helpers ──────────────────────────────────────────

function extractId(uri: string): string {
  if (!uri) return '';
  return uri.split('/').pop() || uri;
}

const ISO3_TO_ISO2: Record<string, string> = {
  AUT: 'AT', BEL: 'BE', BGR: 'BG', HRV: 'HR', CYP: 'CY', CZE: 'CZ',
  DNK: 'DK', EST: 'EE', FIN: 'FI', FRA: 'FR', DEU: 'DE', GRC: 'GR',
  HUN: 'HU', IRL: 'IE', ITA: 'IT', LVA: 'LV', LTU: 'LT', LUX: 'LU',
  MLT: 'MT', NLD: 'NL', POL: 'PL', PRT: 'PT', ROU: 'RO', SVK: 'SK',
  SVN: 'SI', ESP: 'ES', SWE: 'SE',
};

function parseCountryCode(uri: string): string {
  if (!uri) return '';
  const code = extractId(uri).toUpperCase();
  return ISO3_TO_ISO2[code] || (code.length === 2 ? code : code.substring(0, 2));
}

function parseGender(value: unknown): string | undefined {
  const uri = unwrapUri(value) || unwrapLiteral(value);
  if (!uri) return undefined;
  const val = extractId(uri).toUpperCase();
  if (val === 'MALE' || val === 'M') return 'male';
  if (val === 'FEMALE' || val === 'F') return 'female';
  return undefined;
}

// ─── Political group helpers ────────────────────────────────────

const KNOWN_GROUPS = new Set([
  'EPP', 'S&D', 'RE', 'Greens/EFA', 'ECR', 'The Left', 'GUE/NGL',
  'PfE', 'ID', 'NI', 'ESN',
]);

const GROUP_NAME_MAP: [string, string][] = [
  ['EPP', 'European People'],
  ['S&D', 'Socialists and Democrats'],
  ['RE', 'Renew Europe'],
  ['Greens/EFA', 'Greens/European Free Alliance'],
  ['Greens/EFA', 'Verts/ALE'],
  ['ECR', 'European Conservatives'],
  ['The Left', 'The Left'],
  ['GUE/NGL', 'European United Left'],
  ['GUE/NGL', 'Gauche Unitaire'],
  ['PfE', 'Patriots for Europe'],
  ['ID', 'Identity and Democracy'],
  ['ESN', 'Europe of Sovereign Nations'],
];

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

/** Cached map: corporate-body-id → political group short name */
let _politicalGroupMap: Record<string, string> | null = null;

/** Build a map from corporate body IDs/URIs to political group abbreviations */
async function buildPoliticalGroupMap(): Promise<Record<string, string>> {
  if (_politicalGroupMap) return _politicalGroupMap;

  const map: Record<string, string> = {};

  // Seed with known group notations
  for (const g of KNOWN_GROUPS) map[g] = g;

  try {
    const bodies = await fetchCorporateBodies({ limit: 300 });
    for (const body of bodies) {
      const notation = body.notation;
      const label = body.prefLabel;

      // Direct notation match
      if (KNOWN_GROUPS.has(notation)) {
        map[body.id] = notation;
        map[notation] = notation;
        continue;
      }

      // Label-based match
      for (const [short, full] of GROUP_NAME_MAP) {
        if (label.includes(full) || label.includes(short) || notation === short) {
          map[body.id] = short;
          map[notation] = short;
          break;
        }
      }
    }
  } catch {
    // Ignore – we still have the seeded known groups
  }

  _politicalGroupMap = map;
  return map;
}

/**
 * Try to figure out the political group short name from the hasMembership data.
 * Works with multiple JSON-LD serialization styles.
 */
function extractGroupShort(
  memberships: unknown,
  groupMap: Record<string, string> = {},
): string {
  if (!memberships) return 'NI';
  const list = Array.isArray(memberships) ? memberships : [memberships];

  for (const m of list) {
    // ── Object membership (framed JSON-LD) ──
    if (typeof m === 'object' && m !== null) {
      const rec = m as Record<string, unknown>;

      // Attempt to read the organization reference (many possible keys)
      const orgFields = [
        'organization', 'memberOf', 'org', 'hasCorporateBody',
        'corporateBody', 'inverse_hasOrganization', 'bodyReference',
        'epvoc:hasCorporateBody', 'org:organization',
      ];

      for (const field of orgFields) {
        const orgValue = rec[field];
        if (!orgValue) continue;

        const orgUri = unwrapUri(orgValue);
        if (!orgUri) continue;

        const notation = extractId(orgUri);

        // Direct match
        if (KNOWN_GROUPS.has(notation)) return notation;
        if (groupMap[notation]) return groupMap[notation];
        if (groupMap[orgUri]) return groupMap[orgUri];

        // Partial URI match (e.g. URI contains /EPP or /S&D)
        for (const g of KNOWN_GROUPS) {
          if (orgUri.includes(`/${g}`) || orgUri.endsWith(g)) return g;
        }
      }

      // Check label / notation on the membership object
      const labelFields = ['label', 'prefLabel', 'notation', 'name', 'skos:notation'];
      for (const field of labelFields) {
        const label = unwrapLiteral(rec[field]);
        if (!label) continue;
        if (KNOWN_GROUPS.has(label)) return label;
        if (groupMap[label]) return groupMap[label];
        for (const [short, full] of GROUP_NAME_MAP) {
          if (label.includes(full) || label.includes(short)) return short;
        }
      }

      // Fall back: try to match from the membership @id itself
      const mId = unwrapUri(rec['@id']);
      if (mId) {
        for (const g of KNOWN_GROUPS) {
          const escaped = g.replace(/[&/]/g, '');
          if (mId.includes(`-${g}-`) || mId.includes(`/${g}/`) || mId.endsWith(`/${g}`)) return g;
          if (escaped && (mId.includes(`-${escaped}-`) || mId.includes(`/${escaped}`))) return g;
        }
        // Check group map with the full URI
        const mIdShort = extractId(mId);
        if (groupMap[mIdShort]) return groupMap[mIdShort];
      }
    }

    // ── String membership (compacted URI) ──
    if (typeof m === 'string') {
      const notation = extractId(m);
      if (KNOWN_GROUPS.has(notation)) return notation;
      if (groupMap[notation]) return groupMap[notation];
      if (groupMap[m]) return groupMap[m];

      for (const g of KNOWN_GROUPS) {
        if (m.includes(`/${g}`) || m.includes(`/${g}/`)) return g;
      }
    }
  }

  return 'NI';
}

// ─── Parse a single MEP record ──────────────────────────────────

function parseMEP(
  data: Record<string, unknown>,
  groupMap: Record<string, string> = {},
): MEP {
  const id = extractId(
    unwrapUri(data['@id']) || unwrapUri(data['identifier']) || '',
  );

  const label = unwrapLiteral(data['label']) || unwrapLiteral(data['prefLabel']) || '';
  const givenName =
    unwrapLiteral(data['givenName']) ||
    unwrapLiteral(data['foaf:givenName']) ||
    '';
  const familyName =
    unwrapLiteral(data['familyName']) ||
    unwrapLiteral(data['foaf:familyName']) ||
    '';
  const fullName = label || `${givenName} ${familyName}`.trim() || `MEP ${id}`;

  // Country – might be a URI string or a { "@id": "..." } object
  const countryUri =
    unwrapUri(data['citizenship']) ||
    unwrapUri(data['representedCountry']) ||
    unwrapUri(data['hasCountryName']) ||
    unwrapUri(data['country']) ||
    '';
  const countryCode = parseCountryCode(countryUri);

  // Political group from memberships
  const memberships =
    data['hasMembership'] ||
    data['membership'] ||
    data['inverse_hasMember'] ||
    data['memberOf'];
  const groupShort = extractGroupShort(memberships, groupMap);

  // National party
  const nationalParty =
    unwrapLiteral(data['nationalPoliticalGroup']) ||
    unwrapLiteral(data['nationalParty']) ||
    '';

  // Photo
  const photoUrl =
    unwrapUri(data['img']) ||
    unwrapUri(data['image']) ||
    unwrapUri(data['foaf:img']) ||
    `https://www.europarl.europa.eu/mepphoto/${id}.jpg`;

  // Committees extracted from memberships if present
  const committees = extractCommitteesFromMemberships(memberships, groupMap);

  return {
    id,
    identifier: id,
    fullName,
    firstName: givenName,
    lastName: familyName,
    country: '',
    countryCode,
    politicalGroup: GROUP_FULL[groupShort] || groupShort,
    politicalGroupShort: groupShort,
    nationalParty,
    photoUrl,
    active: true,
    gender: parseGender(data['gender'] || data['hasGender']),
    dateOfBirth: unwrapLiteral(data['dateOfBirth']) || undefined,
    placeOfBirth: unwrapLiteral(data['placeOfBirth']) || undefined,
    committees: committees.length > 0 ? committees : undefined,
  };
}

/** Try to pull committee info from the same membership array */
function extractCommitteesFromMemberships(
  memberships: unknown,
  groupMap: Record<string, string>,
): Committee[] {
  if (!memberships) return [];
  const list = Array.isArray(memberships) ? memberships : [memberships];
  const comms: Committee[] = [];

  for (const m of list) {
    if (typeof m !== 'object' || m === null) continue;
    const rec = m as Record<string, unknown>;

    const orgFields = [
      'organization', 'memberOf', 'hasCorporateBody', 'corporateBody',
    ];

    for (const field of orgFields) {
      const orgValue = rec[field];
      if (!orgValue) continue;
      const orgUri = unwrapUri(orgValue);
      if (!orgUri) continue;

      const notation = extractId(orgUri);
      // Skip if it's a political group
      if (KNOWN_GROUPS.has(notation) || groupMap[notation]) continue;

      // Looks like a committee if notation is 2-5 uppercase letters
      if (/^[A-Z]{2,5}$/.test(notation)) {
        const label =
          unwrapLiteral(rec['label']) ||
          unwrapLiteral(rec['prefLabel']) ||
          '';
        const role =
          unwrapLiteral(rec['role']) ||
          unwrapLiteral(rec['hasRole']) ||
          'Member';

        comms.push({
          id: notation,
          name: label || notation,
          shortName: notation,
          role,
          type: 'committee',
        });
      }
    }
  }

  return comms;
}

// ─── Public fetch functions ─────────────────────────────────────

export async function fetchMEPs(params: {
  offset?: number;
  limit?: number;
  countryCode?: string;
  term?: string;
} = {}): Promise<{ items: MEP[]; total: number }> {
  const queryParams: Record<string, string> = {
    offset: String(params.offset || 0),
    limit: String(params.limit || 50),
  };

  if (params.countryCode) {
    queryParams['country-code'] = params.countryCode;
  }

  if (params.term) {
    queryParams['parliamentary-term'] = params.term;
  }

  // Build the group map in parallel with the MEP fetch (first call only)
  const [data, groupMap] = await Promise.all([
    fetchJSON(`${BASE_URL}/meps`, queryParams),
    buildPoliticalGroupMap(),
  ]);

  const graph = extractGraph(data);
  const items = graph.map((item) => parseMEP(item, groupMap));
  const total = extractTotal(data, items.length);

  return { items, total };
}

export async function fetchAllMEPs(countryCode?: string): Promise<MEP[]> {
  const allItems: MEP[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const result = await fetchMEPs({ offset, limit, countryCode });
    allItems.push(...result.items);

    // Stop if we've fetched all or if the batch came back empty
    if (allItems.length >= result.total || result.items.length === 0) break;
    offset += limit;

    // Safety valve
    if (offset > 2000) break;
  }

  return allItems;
}

export async function fetchMEPById(id: string): Promise<MEP> {
  const [data, groupMap] = await Promise.all([
    fetchJSON(`${BASE_URL}/meps/${id}`),
    buildPoliticalGroupMap(),
  ]);

  // Individual endpoint might wrap in @graph or return flat
  if (Array.isArray(data['@graph'])) {
    const graph = data['@graph'] as Record<string, unknown>[];
    // Find the person item
    const person = graph.find(
      (item) =>
        String(item['@type'] || '').includes('Person') ||
        item['givenName'] ||
        item['familyName'],
    );
    if (person) return parseMEP(person, groupMap);
    if (graph.length > 0) return parseMEP(graph[0], groupMap);
  }

  return parseMEP(data as Record<string, unknown>, groupMap);
}

export async function fetchMEPsByCountry(countryCode: string): Promise<MEP[]> {
  return fetchAllMEPs(countryCode);
}

// ─── Corporate bodies ───────────────────────────────────────────

export async function fetchCorporateBodies(params: {
  offset?: number;
  limit?: number;
  type?: string;
} = {}): Promise<CorporateBody[]> {
  const queryParams: Record<string, string> = {
    offset: String(params.offset || 0),
    limit: String(params.limit || 100),
  };

  if (params.type) {
    queryParams['type'] = params.type;
  }

  const data = await fetchJSON(`${BASE_URL}/corporate-bodies`, queryParams);
  const graph = extractGraph(data);

  return graph.map((item: Record<string, unknown>) => ({
    id: extractId(unwrapUri(item['@id']) || ''),
    notation:
      unwrapLiteral(item['notation']) ||
      unwrapLiteral(item['skos:notation']) ||
      '',
    prefLabel:
      unwrapLiteral(item['prefLabel']) ||
      unwrapLiteral(item['label']) ||
      unwrapLiteral(item['skos:prefLabel']) ||
      '',
    type:
      unwrapLiteral(item['@type']) ||
      unwrapLiteral(item['classification']) ||
      '',
    classification: unwrapLiteral(item['classification']) || '',
  }));
}

export async function fetchCommittees(): Promise<Committee[]> {
  // Try fetching with type filter first
  let bodies: CorporateBody[];
  try {
    bodies = await fetchCorporateBodies({ limit: 200, type: 'COMMITTEE' });
  } catch {
    bodies = [];
  }

  // If the type filter didn't work or returned nothing, fetch all and filter
  if (bodies.length === 0) {
    const all = await fetchCorporateBodies({ limit: 300 });
    bodies = all.filter((b) => {
      const t = (b.type + ' ' + b.classification).toLowerCase();
      const n = b.notation;
      // Committees typically have 2-5 letter uppercase notations
      return (
        t.includes('committee') ||
        t.includes('com_') ||
        (n && /^[A-Z]{2,5}$/.test(n) && !KNOWN_GROUPS.has(n))
      );
    });
  }

  // If still nothing, return all bodies that look like committees by notation
  if (bodies.length === 0) {
    const all = await fetchCorporateBodies({ limit: 300 });
    bodies = all.filter(
      (b) => b.notation && /^[A-Z]{2,5}$/.test(b.notation) && !KNOWN_GROUPS.has(b.notation),
    );
  }

  return bodies.map((b) => ({
    id: b.id,
    name: b.prefLabel || b.notation || b.id,
    shortName: b.notation || b.id,
    role: '',
    type: 'committee' as const,
  }));
}

// ─── Plenary documents (shown as votes/legislation) ─────────────

export async function fetchPlenaryDocuments(params: {
  offset?: number;
  limit?: number;
  year?: string;
} = {}): Promise<VoteResult[]> {
  const queryParams: Record<string, string> = {
    offset: String(params.offset || 0),
    limit: String(params.limit || 50),
  };

  if (params.year) {
    queryParams['year'] = params.year;
  }

  const data = await fetchJSON(`${BASE_URL}/plenary-documents`, queryParams);
  const graph = extractGraph(data);

  return graph.map((item: Record<string, unknown>) => {
    // Try many possible title fields
    const title =
      unwrapLiteral(item['title_dcterms']) ||
      unwrapLiteral(item['dcterms:title']) ||
      unwrapLiteral(item['title']) ||
      unwrapLiteral(item['prefLabel']) ||
      unwrapLiteral(item['label']) ||
      unwrapLiteral(item['rdfs:label']) ||
      '';

    const reference =
      unwrapLiteral(item['reference']) ||
      unwrapLiteral(item['notation']) ||
      unwrapLiteral(item['epvoc:reference']) ||
      '';

    const date =
      unwrapLiteral(item['date']) ||
      unwrapLiteral(item['created']) ||
      unwrapLiteral(item['dcterms:date']) ||
      unwrapLiteral(item['dateDocument']) ||
      '';

    // Use the reference as a fallback display title if the real title is empty
    const displayTitle = title || reference || extractId(unwrapUri(item['@id']) || '');

    return {
      id: extractId(unwrapUri(item['@id']) || ''),
      title: displayTitle,
      date,
      documentRef: reference !== displayTitle ? reference : undefined,
      // The plenary-documents endpoint doesn't include vote counts
      totalFor: 0,
      totalAgainst: 0,
      totalAbstention: 0,
      subject: unwrapLiteral(item['subject']) || undefined,
      description: unwrapLiteral(item['description']) || undefined,
    };
  });
}

// ─── Meetings ───────────────────────────────────────────────────

export async function fetchMeetings(params: {
  offset?: number;
  limit?: number;
} = {}) {
  const queryParams: Record<string, string> = {
    offset: String(params.offset || 0),
    limit: String(params.limit || 50),
  };

  const data = await fetchJSON(`${BASE_URL}/meetings`, queryParams);
  const graph = extractGraph(data);

  return graph.map((item: Record<string, unknown>) => ({
    id: extractId(unwrapUri(item['@id']) || ''),
    date:
      unwrapLiteral(item['date']) ||
      unwrapLiteral(item['startDate']) ||
      '',
    type: unwrapLiteral(item['@type']) || '',
    label:
      unwrapLiteral(item['label']) ||
      unwrapLiteral(item['prefLabel']) ||
      '',
  }));
}
