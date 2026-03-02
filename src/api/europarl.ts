import type { MEP, CorporateBody, VoteResult, Committee } from '../types';

const BASE_URL = '/api/ep';

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

function extractId(uri: string): string {
  if (!uri) return '';
  return uri.split('/').pop() || uri;
}

function parseCountryCode(uri: string): string {
  if (!uri) return '';
  const code3 = extractId(uri).toUpperCase();
  return ISO3_TO_ISO2[code3] || code3.substring(0, 2);
}

const ISO3_TO_ISO2: Record<string, string> = {
  AUT: 'AT', BEL: 'BE', BGR: 'BG', HRV: 'HR', CYP: 'CY', CZE: 'CZ',
  DNK: 'DK', EST: 'EE', FIN: 'FI', FRA: 'FR', DEU: 'DE', GRC: 'GR',
  HUN: 'HU', IRL: 'IE', ITA: 'IT', LVA: 'LV', LTU: 'LT', LUX: 'LU',
  MLT: 'MT', NLD: 'NL', POL: 'PL', PRT: 'PT', ROU: 'RO', SVK: 'SK',
  SVN: 'SI', ESP: 'ES', SWE: 'SE',
};

function parseGender(uri: string): string | undefined {
  if (!uri) return undefined;
  const val = extractId(uri).toUpperCase();
  if (val === 'MALE' || val === 'M') return 'male';
  if (val === 'FEMALE' || val === 'F') return 'female';
  return undefined;
}

function extractGroupShort(memberships: unknown): string {
  if (!memberships) return 'NI';
  const list = Array.isArray(memberships) ? memberships : [memberships];
  for (const m of list) {
    if (typeof m === 'object' && m !== null) {
      const rec = m as Record<string, unknown>;
      const org = (rec['organization'] || rec['memberOf'] || '') as string;
      if (typeof org === 'string' && org.includes('org/')) {
        const notation = extractId(org);
        if (KNOWN_GROUPS.has(notation)) return notation;
      }
      const label = (rec['label'] || rec['prefLabel'] || '') as string;
      if (typeof label === 'string') {
        for (const [short, full] of GROUP_NAME_MAP) {
          if (label.includes(full) || label.includes(short)) return short;
        }
      }
    }
    if (typeof m === 'string') {
      const notation = extractId(m);
      if (KNOWN_GROUPS.has(notation)) return notation;
    }
  }
  return 'NI';
}

const KNOWN_GROUPS = new Set([
  'EPP', 'S&D', 'RE', 'Greens/EFA', 'ECR', 'The Left', 'GUE/NGL',
  'PfE', 'ID', 'NI', 'ESN',
]);

const GROUP_NAME_MAP: [string, string][] = [
  ['EPP', 'European People'],
  ['S&D', 'Socialists and Democrats'],
  ['RE', 'Renew Europe'],
  ['Greens/EFA', 'Greens/European Free Alliance'],
  ['ECR', 'European Conservatives'],
  ['The Left', 'The Left'],
  ['GUE/NGL', 'European United Left'],
  ['PfE', 'Patriots for Europe'],
  ['ID', 'Identity and Democracy'],
  ['ESN', 'Europe of Sovereign Nations'],
];

export const GROUP_FULL: Record<string, string> = {
  'EPP': 'European People\'s Party',
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

function parseMEP(data: Record<string, unknown>): MEP {
  const id = extractId((data['@id'] as string) || (data['identifier'] as string) || '');
  const label = (data['label'] as string) || (data['prefLabel'] as string) || '';
  const givenName = (data['givenName'] as string) || '';
  const familyName = (data['familyName'] as string) || '';
  const fullName = label || `${givenName} ${familyName}`.trim();

  const countryUri = (data['citizenship'] as string) ||
    (data['representedCountry'] as string) || '';
  const countryCode = parseCountryCode(countryUri);

  const memberships = data['hasMembership'] || data['membership'];
  const groupShort = extractGroupShort(memberships);

  const nationalParty = (data['nationalPoliticalGroup'] as string) ||
    (data['nationalParty'] as string) || '';

  const photoUrl = (data['img'] as string) ||
    `https://www.europarl.europa.eu/mepphoto/${id}.jpg`;

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
    gender: parseGender(data['gender'] as string),
    dateOfBirth: data['dateOfBirth'] as string,
    placeOfBirth: data['placeOfBirth'] as string,
  };
}

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

  const data = await fetchJSON(`${BASE_URL}/meps`, queryParams);
  const graph = data['@graph'] || data['data'] || [];
  const items = Array.isArray(graph) ? graph.map(parseMEP) : [];
  const total = data['totalItems'] || data['total'] || items.length;

  return { items, total };
}

export async function fetchAllMEPs(countryCode?: string): Promise<MEP[]> {
  const allItems: MEP[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const result = await fetchMEPs({ offset, limit, countryCode });
    allItems.push(...result.items);
    if (allItems.length >= result.total || result.items.length === 0) break;
    offset += limit;
    if (offset > 1500) break;
  }

  return allItems;
}

export async function fetchMEPById(id: string): Promise<MEP> {
  const data = await fetchJSON(`${BASE_URL}/meps/${id}`);
  return parseMEP(data);
}

export async function fetchMEPsByCountry(countryCode: string): Promise<MEP[]> {
  return fetchAllMEPs(countryCode);
}

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
  const graph = data['@graph'] || data['data'] || [];

  return Array.isArray(graph)
    ? graph.map((item: Record<string, unknown>) => ({
        id: extractId((item['@id'] as string) || ''),
        notation: (item['notation'] as string) || '',
        prefLabel: (item['prefLabel'] as string) || (item['label'] as string) || '',
        type: (item['@type'] as string) || (item['classification'] as string) || '',
        classification: (item['classification'] as string) || '',
      }))
    : [];
}

export async function fetchCommittees(): Promise<Committee[]> {
  const bodies = await fetchCorporateBodies({ limit: 100, type: 'COMMITTEE' });
  return bodies.map((b) => ({
    id: b.id,
    name: b.prefLabel,
    shortName: b.notation || b.id,
    role: '',
    type: 'committee' as const,
  }));
}

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
  const graph = data['@graph'] || data['data'] || [];

  return Array.isArray(graph)
    ? graph.map((item: Record<string, unknown>) => ({
        id: extractId((item['@id'] as string) || ''),
        title: (item['title_dcterms'] as string) || (item['title'] as string) ||
               (item['prefLabel'] as string) || (item['label'] as string) || '',
        date: (item['date'] as string) || (item['created'] as string) || '',
        documentRef: (item['reference'] as string) || (item['notation'] as string) || '',
        totalFor: 0,
        totalAgainst: 0,
        totalAbstention: 0,
      }))
    : [];
}

export async function fetchMeetings(params: {
  offset?: number;
  limit?: number;
} = {}) {
  const queryParams: Record<string, string> = {
    offset: String(params.offset || 0),
    limit: String(params.limit || 50),
  };

  const data = await fetchJSON(`${BASE_URL}/meetings`, queryParams);
  const graph = data['@graph'] || data['data'] || [];

  return Array.isArray(graph)
    ? graph.map((item: Record<string, unknown>) => ({
        id: extractId((item['@id'] as string) || ''),
        date: (item['date'] as string) || (item['startDate'] as string) || '',
        type: (item['@type'] as string) || '',
        label: (item['label'] as string) || (item['prefLabel'] as string) || '',
      }))
    : [];
}
