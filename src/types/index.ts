export interface MEP {
  id: string;
  identifier: string;
  fullName: string;
  firstName: string;
  lastName: string;
  country: string;
  countryCode: string;
  politicalGroup: string;
  politicalGroupShort: string;
  nationalParty: string;
  photoUrl: string;
  active: boolean;
  gender?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  committees?: Committee[];
  delegations?: string[];
  email?: string;
  website?: string;
}

export interface Committee {
  id: string;
  name: string;
  shortName: string;
  role: string;
  type: 'committee' | 'delegation' | 'subcommittee';
}

export interface CorporateBody {
  id: string;
  notation: string;
  prefLabel: string;
  type: string;
  classification?: string;
  memberCount?: number;
}

export interface VoteResult {
  id: string;
  title: string;
  date: string;
  documentRef?: string;
  totalFor: number;
  totalAgainst: number;
  totalAbstention: number;
  subject?: string;
  description?: string;
  groups?: GroupVote[];
}

export interface GroupVote {
  group: string;
  groupShort: string;
  votesFor: number;
  votesAgainst: number;
  abstentions: number;
  noVote: number;
}

export interface PlenaryDocument {
  id: string;
  title: string;
  date: string;
  type: string;
  reference?: string;
  authors?: string[];
}

export interface ParliamentaryTerm {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
}

export interface CountryStats {
  country: string;
  countryCode: string;
  mepCount: number;
  groups: Record<string, number>;
  avgAttendance?: number;
}

export interface PoliticalGroupInfo {
  short: string;
  full: string;
  color: string;
  mepCount: number;
}

export const POLITICAL_GROUP_COLORS: Record<string, string> = {
  'EPP': '#0066CC',
  'S&D': '#CC0000',
  'RE': '#FFD700',
  'Greens/EFA': '#009933',
  'ID': '#003366',
  'ECR': '#0099CC',
  'GUE/NGL': '#990000',
  'The Left': '#990000',
  'NI': '#999999',
  'PfE': '#1a3a5c',
  'ESN': '#5b3a1a',
};

export const EU_COUNTRIES: Record<string, string> = {
  AT: 'Austria', BE: 'Belgium', BG: 'Bulgaria', HR: 'Croatia',
  CY: 'Cyprus', CZ: 'Czechia', DK: 'Denmark', EE: 'Estonia',
  FI: 'Finland', FR: 'France', DE: 'Germany', GR: 'Greece',
  HU: 'Hungary', IE: 'Ireland', IT: 'Italy', LV: 'Latvia',
  LT: 'Lithuania', LU: 'Luxembourg', MT: 'Malta', NL: 'Netherlands',
  PL: 'Poland', PT: 'Portugal', RO: 'Romania', SK: 'Slovakia',
  SI: 'Slovenia', ES: 'Spain', SE: 'Sweden',
};

export const COUNTRY_FLAGS: Record<string, string> = {
  AT: '🇦🇹', BE: '🇧🇪', BG: '🇧🇬', HR: '🇭🇷',
  CY: '🇨🇾', CZ: '🇨🇿', DK: '🇩🇰', EE: '🇪🇪',
  FI: '🇫🇮', FR: '🇫🇷', DE: '🇩🇪', GR: '🇬🇷',
  HU: '🇭🇺', IE: '🇮🇪', IT: '🇮🇹', LV: '🇱🇻',
  LT: '🇱🇹', LU: '🇱🇺', MT: '🇲🇹', NL: '🇳🇱',
  PL: '🇵🇱', PT: '🇵🇹', RO: '🇷🇴', SK: '🇸🇰',
  SI: '🇸🇮', ES: '🇪🇸', SE: '🇸🇪',
};
