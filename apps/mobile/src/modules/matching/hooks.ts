import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchingApi } from './api';

export const MATCHING_KEYS = {
  all: ['matching'] as const,
  suggestions: (userId: string) => [...MATCHING_KEYS.all, 'suggestions', userId] as const,
  trust: (userId: string) => [...MATCHING_KEYS.all, 'trust', userId] as const,
};

export function useMatchingSuggestions(userId?: string) {
  return useQuery({
    queryKey: MATCHING_KEYS.suggestions(userId ?? ''),
    queryFn: () => matchingApi.getSuggestions(userId!),
    enabled: !!userId,
  });
}

export function useUserTrust(userId?: string) {
  return useQuery({
    queryKey: MATCHING_KEYS.trust(userId ?? ''),
    queryFn: () => matchingApi.getUserTrust(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

export function useSwipeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { candidateId: string; action: 'liked' | 'passed' }) =>
      matchingApi.swipe(params.candidateId, params.action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MATCHING_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
  });
}
