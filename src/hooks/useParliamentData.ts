import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  fetchAllMEPs,
  fetchMEPById,
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

const STALE_TIME = 15 * 60 * 1000;

// ─── Single shared cache for ALL MEPs ───────────────────────────
// Every MEP-derived hook reads from this one query.
// This eliminates redundant API calls (previously 3x on Dashboard alone).

export function useAllMEPs() {
  return useQuery<MEP[]>({
    queryKey: ['all-meps'],
    queryFn: () => fetchAllMEPs(),
    staleTime: STALE_TIME,
    gcTime: 30 * 60 * 1000,
  });
}

// ─── Derived hooks (all client-side filtering from shared cache) ─

export function useMEPs(params: {
  offset?: number;
  limit?: number;
  countryCode?: string;
  group?: string;
  search?: string;
  committee?: string;
} = {}) {
  const { data: allMEPs, isLoading, error } = useAllMEPs();

  const result = useMemo(() => {
    if (!allMEPs) return { items: [] as MEP[], total: 0 };
    let filtered = allMEPs;

    if (params.countryCode) {
      filtered = filtered.filter(m => m.countryCode === params.countryCode);
    }
    if (params.group) {
      filtered = filtered.filter(m => m.politicalGroupShort === params.group);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(m =>
        m.fullName.toLowerCase().includes(q) ||
        m.nationalParty.toLowerCase().includes(q)
      );
    }
    if (params.committee) {
      filtered = filtered.filter(m =>
        m.committees?.some(c => c.shortName === params.committee)
      );
    }

    return { items: filtered, total: filtered.length };
  }, [allMEPs, params.countryCode, params.group, params.search, params.committee]);

  return { data: result, isLoading, error };
}

export function useMEPById(id: string) {
  return useQuery({
    queryKey: ['mep', id],
    queryFn: () => fetchMEPById(id),
    enabled: !!id,
    staleTime: STALE_TIME,
  });
}

export function useCountryMEPs(countryCode: string) {
  const { data: allMEPs, isLoading, error } = useAllMEPs();

  const data = useMemo(() => {
    if (!allMEPs) return undefined;
    return allMEPs.filter(m => m.countryCode === countryCode);
  }, [allMEPs, countryCode]);

  return { data, isLoading, error } as { data: MEP[] | undefined; isLoading: boolean; error: Error | null };
}

export function useCommittees() {
  return useQuery<Committee[]>({
    queryKey: ['committees'],
    queryFn: () => fetchCommittees(),
    staleTime: 30 * 60 * 1000,
  });
}

export function useCommitteeMembers(committeeShort: string) {
  const { data: allMEPs, isLoading, error } = useAllMEPs();

  const data = useMemo(() => {
    if (!allMEPs || !committeeShort) return undefined;
    return allMEPs.filter(m =>
      m.committees?.some(c => c.shortName === committeeShort)
    );
  }, [allMEPs, committeeShort]);

  return { data, isLoading, error } as {
    data: MEP[] | undefined;
    isLoading: boolean;
    error: Error | null;
  };
}

export function useVotes() {
  return useQuery<VoteResult[]>({
    queryKey: ['votes'],
    queryFn: () => fetchPlenaryDocuments({ limit: 100 }),
    staleTime: STALE_TIME,
  });
}

export function useGroupStats() {
  const { data: allMEPs, isLoading, error, refetch } = useAllMEPs();

  const data = useMemo(() => {
    if (!allMEPs) return undefined;
    const counts: Record<string, { count: number; countries: Set<string> }> = {};

    for (const m of allMEPs) {
      const g = m.politicalGroupShort;
      if (!counts[g]) counts[g] = { count: 0, countries: new Set() };
      counts[g].count++;
      if (m.countryCode) counts[g].countries.add(m.countryCode);
    }

    return Object.entries(counts)
      .map(([short, d]) => ({
        short,
        full: GROUP_FULL[short] || short,
        mepCount: d.count,
        countries: d.countries.size,
      }))
      .sort((a, b) => b.mepCount - a.mepCount);
  }, [allMEPs]);

  return { data, isLoading, error, refetch };
}

export function useCountryStats() {
  const { data: allMEPs, isLoading, error, refetch } = useAllMEPs();

  const data = useMemo(() => {
    if (!allMEPs) return undefined;
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
  }, [allMEPs]);

  return { data, isLoading, error, refetch };
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
    staleTime: STALE_TIME,
  });
}

export function useMeetings() {
  return useQuery({
    queryKey: ['meetings'],
    queryFn: () => fetchMeetings({ limit: 100 }),
    staleTime: STALE_TIME,
  });
}
