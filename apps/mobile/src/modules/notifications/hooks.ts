import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from './api';

export const NOTIFICATIONS_KEYS = {
  all: ['notifications'] as const,
  mine: (userId: string) => [...NOTIFICATIONS_KEYS.all, 'mine', userId] as const,
};

export function useMyNotifications(userId?: string) {
  return useQuery({
    queryKey: NOTIFICATIONS_KEYS.mine(userId ?? ''),
    queryFn: () => notificationsApi.getMyNotifications(userId!),
    enabled: !!userId,
  });
}
