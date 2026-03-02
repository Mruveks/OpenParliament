import { useQuery } from '@tanstack/react-query';
import {
  fetchAllMEPs,
  fetchMEPById,
  fetchMEPsByCountry,
  fetchCommittees,
  fetchCorporateBodies,
  fetchPlenaryDocuments,
  fetchMeetings,
  GROUP_FULL,
} from '../api/europarl';
import type { MEP, Committee, VoteResult, CorporateBody } from '../types';
import { EU_COUNTRIES } from '../types';

const SEAT_ALLOCATION: Record<string, number> = {
  DE: 96, FR: 81, IT: 76, ES: 61, PL: 52, RO: 33, NL: 31, BE: 22,
  CZ: 21, GR: 21, HU: 21, PT: 21, SE: 21, AT: 20, BG: 17, DK: 15,
  FI: 15, SK: 15, IE: 14, HR: 12, LT: 11, LV: 9, SI: 9, EE: 7,
  CY: 6, LU: 6, MT: 6,
};

export function useMEPs(params: {
  offset?: number;
  limit?: number;
  countryCode?: string;
  group?: string;
  search?: string;
  committee?: string;
} = {}) {
  return useQuery({
    queryKey: ['meps', params],
    queryFn: async () => {
      const result = await fetchAllMEPs(params.countryCode);
      let filtered = result;

      if (params.group) {
        filtered = filtered.filter((m) => m.politicalGroupShort === params.group);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (m) =>
            m.fullName.toLowerCase().includes(q) ||
            m.nationalParty.toLowerCase().includes(q)
        );
      }
      if (params.committee) {
        filtered = filtered.filter(
          (m) => m.committees?.some((c) => c.shortName === params.committee)
        );
      }

      return { items: filtered, total: filtered.length };
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useMEPById(id: string) {
  return useQuery({
    queryKey: ['mep', id],
    queryFn: () => fetchMEPById(id),
    enabled: !!id,
  });
}

export function useCountryMEPs(countryCode: string) {
  return useQuery<MEP[]>({
    queryKey: ['country-meps', countryCode],
    queryFn: () => fetchMEPsByCountry(countryCode),
    enabled: !!countryCode,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCommittees() {
  return useQuery<Committee[]>({
    queryKey: ['committees'],
    queryFn: () => fetchCommittees(),
    staleTime: 30 * 60 * 1000,
  });
}

export function useCommitteeMembers(committeeShort: string) {
  return useQuery<MEP[]>({
    queryKey: ['committee-members', committeeShort],
    queryFn: async () => {
      const allMEPs = await fetchAllMEPs();
      return allMEPs.filter(
        (m) => m.committees?.some((c) => c.shortName === committeeShort)
      );
    },
    enabled: !!committeeShort,
    staleTime: 10 * 60 * 1000,
  });
}

export function useVotes() {
  return useQuery<VoteResult[]>({
    queryKey: ['votes'],
    queryFn: () => fetchPlenaryDocuments({ limit: 100 }),
    staleTime: 10 * 60 * 1000,
  });
}

export function useGroupStats() {
  return useQuery({
    queryKey: ['group-stats'],
    queryFn: async () => {
      const allMEPs = await fetchAllMEPs();
      const counts: Record<string, { count: number; countries: Set<string> }> = {};

      for (const m of allMEPs) {
        const g = m.politicalGroupShort;
        if (!counts[g]) counts[g] = { count: 0, countries: new Set() };
        counts[g].count++;
        if (m.countryCode) counts[g].countries.add(m.countryCode);
      }

      return Object.entries(counts)
        .map(([short, data]) => ({
          short,
          full: GROUP_FULL[short] || short,
          mepCount: data.count,
          countries: data.countries.size,
        }))
        .sort((a, b) => b.mepCount - a.mepCount);
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useCountryStats() {
  return useQuery({
    queryKey: ['country-stats'],
    queryFn: async () => {
      const allMEPs = await fetchAllMEPs();
      const byCountry: Record<string, MEP[]> = {};

      for (const m of allMEPs) {
        const cc = m.countryCode;
        if (!cc) continue;
        if (!byCountry[cc]) byCountry[cc] = [];
        byCountry[cc].push(m);
      }

      return Object.entries(byCountry)
        .map(([countryCode, members]) => {
          const groups: Record<string, number> = {};
          for (const m of members) {
            groups[m.politicalGroupShort] = (groups[m.politicalGroupShort] || 0) + 1;
          }
          return {
            country: EU_COUNTRIES[countryCode] || countryCode,
            countryCode,
            mepCount: members.length,
            totalSeats: SEAT_ALLOCATION[countryCode] || members.length,
            groups,
          };
        })
        .sort((a, b) => b.totalSeats - a.totalSeats);
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useCorporateBodies() {
  return useQuery<CorporateBody[]>({
    queryKey: ['corporate-bodies'],
    queryFn: () => fetchCorporateBodies({ limit: 200 }),
    staleTime: 30 * 60 * 1000,
  });
}

export function usePlenaryDocuments(year?: string) {
  return useQuery<VoteResult[]>({
    queryKey: ['plenary-documents', year],
    queryFn: () => fetchPlenaryDocuments({ limit: 100, year }),
    staleTime: 10 * 60 * 1000,
  });
}

export function useMeetings() {
  return useQuery({
    queryKey: ['meetings'],
    queryFn: () => fetchMeetings({ limit: 100 }),
    staleTime: 10 * 60 * 1000,
  });
}
