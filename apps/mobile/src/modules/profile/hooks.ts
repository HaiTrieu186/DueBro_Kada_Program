import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from './api';
import type { LifestyleProfileInput } from '@duebro/shared-types';

export const PROFILE_KEYS = {
  all: ['profile'] as const,
  me: (userId: string) => [...PROFILE_KEYS.all, 'me', userId] as const,
};

export function useMyProfile(userId?: string) {
  return useQuery({
    queryKey: PROFILE_KEYS.me(userId ?? ''),
    queryFn: () => profileApi.getMyProfile(userId!),
    enabled: !!userId,
  });
}

export function useSaveLifestyleMutation(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LifestyleProfileInput & { displayName?: string }) =>
      profileApi.saveLifestyleProfile(userId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['matching'] });
    },
  });
}
