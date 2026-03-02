import { useQuery } from '@tanstack/react-query';
import {
  getMockMEPs,
  getMockMEPById,
  getMockCountryMEPs,
  getMockCommittees,
  getMockCommitteeMembers,
  getMockVotes,
  getMockGroupStats,
  getMockCountryStats,
  getMockCorporateBodies,
} from '../api/mockData';
import type { MEP, Committee, VoteResult, CorporateBody } from '../types';

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
    queryFn: () => getMockMEPs(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMEPById(id: string) {
  return useQuery({
    queryKey: ['mep', id],
    queryFn: () => getMockMEPById(id),
    enabled: !!id,
  });
}

export function useCountryMEPs(countryCode: string) {
  return useQuery<MEP[]>({
    queryKey: ['country-meps', countryCode],
    queryFn: () => getMockCountryMEPs(countryCode),
    enabled: !!countryCode,
  });
}

export function useCommittees() {
  return useQuery<Committee[]>({
    queryKey: ['committees'],
    queryFn: () => getMockCommittees(),
  });
}

export function useCommitteeMembers(committeeShort: string) {
  return useQuery<MEP[]>({
    queryKey: ['committee-members', committeeShort],
    queryFn: () => getMockCommitteeMembers(committeeShort),
    enabled: !!committeeShort,
  });
}

export function useVotes() {
  return useQuery<VoteResult[]>({
    queryKey: ['votes'],
    queryFn: () => getMockVotes(),
  });
}

export function useGroupStats() {
  return useQuery({
    queryKey: ['group-stats'],
    queryFn: () => getMockGroupStats(),
  });
}

export function useCountryStats() {
  return useQuery({
    queryKey: ['country-stats'],
    queryFn: () => getMockCountryStats(),
  });
}

export function useCorporateBodies() {
  return useQuery<CorporateBody[]>({
    queryKey: ['corporate-bodies'],
    queryFn: () => getMockCorporateBodies(),
  });
}
