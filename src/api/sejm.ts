export interface SejmMP {
  id: number;
  firstName: string;
  secondName?: string;
  lastName: string;
  firstLastName: string;
  lastFirstName: string;
  club: string;
  districtName: string;
  districtNum: number;
  voivodeship: string;
  numberOfVotes: number;
  active: boolean;
  inactiveCause?: string;
  birthDate?: string;
  birthLocation?: string;
  educationLevel?: string;
  profession?: string;
  email?: string;
}

export interface SejmClub {
  id: string;
  name: string;
  membersCount: number;
  phone?: string;
  fax?: string;
  email?: string;
}

export interface SejmCommittee {
  code: string;
  name: string;
  nameGenitive?: string;
  type: string;
  appointmentDate?: string;
  compositionDate?: string;
  scope?: string;
  members?: SejmCommitteeMember[];
}

export interface SejmCommitteeMember {
  id: number;
  lastFirstName: string;
  club: string;
  function?: string;
}

export interface SejmVoting {
  term: number;
  sitting: number;
  sittingDay: number;
  votingNumber: number;
  date: string;
  title: string;
  description?: string;
  topic?: string;
  kind: string;
  yes: number;
  no: number;
  abstain: number;
  notParticipating: number;
  totalVoted?: number;
  present?: number;
}

export interface SejmProcess {
  term: number;
  number: string;
  title: string;
  description?: string;
  documentType?: string;
  changeDate?: string;
  processStartDate?: string;
  uE?: boolean;
  passed?: boolean;
  stages?: SejmProcessStage[];
}

export interface SejmProcessStage {
  stageName: string;
  stageType?: string;
  date?: string;
  comment?: string;
  children?: SejmProcessStage[];
}

// The /votings endpoint returns an array of objects with sitting+date+count
export interface SejmVotingDay {
  date: string;
  sitting: number;
  votingCount?: number;
}

const BASE_URL = '/api/sejm';
const TERM = 10;

async function fetchSejmJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Sejm API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function fetchSejmMPs(): Promise<SejmMP[]> {
  return fetchSejmJSON<SejmMP[]>(`/sejm/term${TERM}/MP`);
}

export async function fetchSejmMPById(id: number): Promise<SejmMP> {
  return fetchSejmJSON<SejmMP>(`/sejm/term${TERM}/MP/${id}`);
}

export function getSejmMPPhotoUrl(id: number): string {
  return `/api/sejm/sejm/term${TERM}/MP/${id}/photo`;
}

export async function fetchSejmClubs(): Promise<SejmClub[]> {
  return fetchSejmJSON<SejmClub[]>(`/sejm/term${TERM}/clubs`);
}

export async function fetchSejmCommittees(): Promise<SejmCommittee[]> {
  return fetchSejmJSON<SejmCommittee[]>(`/sejm/term${TERM}/committees`);
}

export async function fetchSejmVotings(sitting: number): Promise<SejmVoting[]> {
  return fetchSejmJSON<SejmVoting[]>(`/sejm/term${TERM}/votings/${sitting}`);
}

export async function fetchSejmVotingDays(): Promise<SejmVotingDay[]> {
  return fetchSejmJSON<SejmVotingDay[]>(`/sejm/term${TERM}/votings`);
}

export async function fetchSejmRecentVotings(): Promise<SejmVoting[]> {
  // Fetch the latest sitting's votings
  const days = await fetchSejmVotingDays();
  if (days.length === 0) return [];
  // Get the most recent sitting
  const latestSitting = days[days.length - 1]?.sitting;
  if (!latestSitting) return [];
  return fetchSejmVotings(latestSitting);
}

export async function fetchSejmProcesses(params?: {
  limit?: number;
  offset?: number;
}): Promise<SejmProcess[]> {
  const all = await fetchSejmJSON<SejmProcess[]>(`/sejm/term${TERM}/processes`);
  if (params?.offset || params?.limit) {
    const offset = params.offset || 0;
    const limit = params.limit || 50;
    return all.slice(offset, offset + limit);
  }
  return all;
}

export { TERM as SEJM_TERM };
