import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { chatApi } from './api';

export const CHAT_KEYS = {
  all: ['chat'] as const,
  connections: (userId: string) => [...CHAT_KEYS.all, 'connections', userId] as const,
  messages: (connectionId: string) => [...CHAT_KEYS.all, 'messages', connectionId] as const,
};

/**
 * Realtime hook for incoming chat messages (ARCH Mục 4.7)
 */
export function useChatRealtime(connectionId?: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!connectionId) return;

    // Unique channel identifier để tránh xung đột kênh khi component re-render / Fast Refresh
    const channelId = `chat:${connectionId}:${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          queryClient.setQueryData(
            CHAT_KEYS.messages(connectionId),
            (old: any[] = []) => {
              if (old.some((m) => m.id === payload.new.id)) return old;
              return [...old, payload.new];
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [connectionId, queryClient]);
}

export function useConnections(userId?: string) {
  return useQuery({
    queryKey: CHAT_KEYS.connections(userId ?? ''),
    queryFn: () => chatApi.getConnections(userId!),
    enabled: !!userId,
  });
}

export function useMessages(connectionId?: string | null) {
  return useQuery({
    queryKey: CHAT_KEYS.messages(connectionId ?? ''),
    queryFn: () => chatApi.getMessages(connectionId!),
    enabled: !!connectionId,
  });
}

export function useSendMessage(connectionId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => chatApi.sendMessage(connectionId!, content),
    onSuccess: (newMessage) => {
      if (connectionId) {
        queryClient.setQueryData(
          CHAT_KEYS.messages(connectionId),
          (old: any[] = []) => [...old, newMessage]
        );
      }
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.all });
    },
  });
}

export function useProposeRoom(connectionId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomName: string) => chatApi.proposeRoom(connectionId!, roomName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.all });
    },
  });
}

export function useAcceptRoom(connectionId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => chatApi.acceptRoom(connectionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['household'] });
    },
  });
}
