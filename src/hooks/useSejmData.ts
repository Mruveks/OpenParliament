import { useQuery } from '@tanstack/react-query';
import {
  fetchSejmMPs,
  fetchSejmClubs,
  fetchSejmCommittees,
  fetchSejmRecentVotings,
  fetchSejmProcesses,
} from '../api/sejm';
import type { SejmMP, SejmClub, SejmCommittee, SejmVoting, SejmProcess } from '../api/sejm';

export function useSejmMPs() {
  return useQuery<SejmMP[]>({
    queryKey: ['sejm-mps'],
    queryFn: () => fetchSejmMPs(),
    staleTime: 30 * 60 * 1000,
  });
}

export function useSejmClubs() {
  return useQuery<SejmClub[]>({
    queryKey: ['sejm-clubs'],
    queryFn: () => fetchSejmClubs(),
    staleTime: 30 * 60 * 1000,
  });
}

export function useSejmCommittees() {
  return useQuery<SejmCommittee[]>({
    queryKey: ['sejm-committees'],
    queryFn: () => fetchSejmCommittees(),
    staleTime: 30 * 60 * 1000,
  });
}

export function useSejmRecentVotings() {
  return useQuery<SejmVoting[]>({
    queryKey: ['sejm-recent-votings'],
    queryFn: () => fetchSejmRecentVotings(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useSejmProcesses(params?: { limit?: number; offset?: number }) {
  return useQuery<SejmProcess[]>({
    queryKey: ['sejm-processes', params],
    queryFn: () => fetchSejmProcesses(params),
    staleTime: 10 * 60 * 1000,
  });
}
