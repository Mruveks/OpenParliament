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
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

function extractId(uri: string): string {
  return uri.split('/').pop() || uri;
}

function parseMEP(data: Record<string, unknown>): MEP {
  const id = extractId((data['@id'] as string) || (data['identifier'] as string) || '');
  const label = (data['label'] as string) || (data['prefLabel'] as string) || '';
  const givenName = (data['givenName'] as string) || '';
  const familyName = (data['familyName'] as string) || '';
  const fullName = label || `${givenName} ${familyName}`.trim();

  const countryUri = (data['representedCountry'] as string) ||
    (data['citizenship'] as string) || '';
  const countryCode = countryUri.split('/').pop()?.toUpperCase() || '';

  const groupUri = (data['politicalGroup'] as string) ||
    (data['hasMembership'] as string) || '';
  const groupNotation = extractId(groupUri);

  const photoUrl = (data['img'] as string) ||
    `https://www.europarl.europa.eu/mepphoto/${id}.jpg`;

  return {
    id,
    identifier: id,
    fullName,
    firstName: givenName,
    lastName: familyName,
    country: countryCode,
    countryCode,
    politicalGroup: groupNotation,
    politicalGroupShort: groupNotation,
    nationalParty: (data['nationalParty'] as string) || '',
    photoUrl,
    active: (data['hasStatus'] as string)?.includes('ACTIVE') !== false,
    gender: data['gender'] as string,
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

  const items = Array.isArray(data['@graph'])
    ? data['@graph'].map(parseMEP)
    : [];

  const total = data['totalItems'] || items.length;

  return { items, total };
}

export async function fetchMEPById(id: string): Promise<MEP> {
  const data = await fetchJSON(`${BASE_URL}/meps/${id}`);
  return parseMEP(data);
}

export async function fetchMEPsByCountry(countryCode: string): Promise<MEP[]> {
  const result = await fetchMEPs({ countryCode, limit: 100 });
  return result.items;
}

export async function fetchCorporateBodies(params: {
  offset?: number;
  limit?: number;
  type?: string;
} = {}): Promise<CorporateBody[]> {
  const queryParams: Record<string, string> = {
    offset: String(params.offset || 0),
    limit: String(params.limit || 50),
  };

  if (params.type) {
    queryParams['type'] = params.type;
  }

  const data = await fetchJSON(`${BASE_URL}/corporate-bodies`, queryParams);

  return Array.isArray(data['@graph'])
    ? data['@graph'].map((item: Record<string, unknown>) => ({
        id: extractId((item['@id'] as string) || ''),
        notation: (item['notation'] as string) || '',
        prefLabel: (item['prefLabel'] as string) || (item['label'] as string) || '',
        type: (item['@type'] as string) || '',
        classification: (item['classification'] as string) || '',
      }))
    : [];
}

export async function fetchCorporateBodyById(id: string): Promise<CorporateBody & { members?: MEP[] }> {
  const data = await fetchJSON(`${BASE_URL}/corporate-bodies/${id}`);

  const body: CorporateBody = {
    id: extractId((data['@id'] as string) || ''),
    notation: (data['notation'] as string) || '',
    prefLabel: (data['prefLabel'] as string) || (data['label'] as string) || '',
    type: (data['@type'] as string) || '',
    classification: (data['classification'] as string) || '',
  };

  return body;
}

export async function fetchCommittees(): Promise<Committee[]> {
  const bodies = await fetchCorporateBodies({ limit: 100, type: 'COMMITTEE' });
  return bodies.map((b) => ({
    id: b.id,
    name: b.prefLabel,
    shortName: b.notation,
    role: '',
    type: 'committee' as const,
  }));
}

export async function fetchVoteResults(params: {
  offset?: number;
  limit?: number;
  year?: string;
} = {}): Promise<VoteResult[]> {
  const queryParams: Record<string, string> = {
    offset: String(params.offset || 0),
    limit: String(params.limit || 20),
  };

  if (params.year) {
    queryParams['year'] = params.year;
  }

  const data = await fetchJSON(`${BASE_URL}/plenary-documents`, queryParams);

  return Array.isArray(data['@graph'])
    ? data['@graph'].map((item: Record<string, unknown>) => ({
        id: extractId((item['@id'] as string) || ''),
        title: (item['title'] as string) || (item['prefLabel'] as string) || '',
        date: (item['date'] as string) || '',
        documentRef: (item['reference'] as string) || '',
        totalFor: 0,
        totalAgainst: 0,
        totalAbstention: 0,
      }))
    : [];
}
