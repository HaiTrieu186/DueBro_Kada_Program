import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '../../lib/supabase';
import { householdApi } from './api';
import type { TaskCategory } from '@duebro/shared-types';

export const HOUSEHOLD_KEYS = {
  all: ['household'] as const,
  rooms: (userId: string) => [...HOUSEHOLD_KEYS.all, 'rooms', userId] as const,
  members: (roomId: string) => [...HOUSEHOLD_KEYS.all, 'members', roomId] as const,
  openTasks: (roomId: string) => [...HOUSEHOLD_KEYS.all, 'open_tasks', roomId] as const,
  myTasks: (roomId: string, userId: string) => [...HOUSEHOLD_KEYS.all, 'my_tasks', roomId, userId] as const,
  pendingReview: (roomId: string, userId: string) => [...HOUSEHOLD_KEYS.all, 'pending_review', roomId, userId] as const,
  taskDetail: (taskId: string) => [...HOUSEHOLD_KEYS.all, 'task', taskId] as const,
  weekBoard: (roomId: string) => [...HOUSEHOLD_KEYS.all, 'week_board', roomId] as const,
  karma: (userId: string) => [...HOUSEHOLD_KEYS.all, 'karma', userId] as const,
  templates: (roomId: string) => [...HOUSEHOLD_KEYS.all, 'templates', roomId] as const,
};

/**
 * Realtime hook to listen on room tasks changes (ARCH Mục 4.7 & 15.3)
 */
export function useHouseholdRealtime(roomId?: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!roomId) return;

    // Unique channel identifier để tránh xung đột kênh khi component re-render / Fast Refresh
    const channelId = `room:${roomId}:${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_instances', filter: `room_id=eq.${roomId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: HOUSEHOLD_KEYS.openTasks(roomId) });
          queryClient.invalidateQueries({ queryKey: HOUSEHOLD_KEYS.all });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);
}

export function useMyRooms(userId?: string) {
  return useQuery({
    queryKey: HOUSEHOLD_KEYS.rooms(userId ?? ''),
    queryFn: () => householdApi.myRooms(userId!),
    enabled: !!userId,
  });
}

export function useRoomMembers(roomId?: string | null) {
  return useQuery({
    queryKey: HOUSEHOLD_KEYS.members(roomId ?? ''),
    queryFn: () => householdApi.roomMembers(roomId!),
    enabled: !!roomId,
  });
}

export function useOpenTasks(roomId?: string | null) {
  return useQuery({
    queryKey: HOUSEHOLD_KEYS.openTasks(roomId ?? ''),
    queryFn: () => householdApi.openTasks(roomId!),
    enabled: !!roomId,
  });
}

export function useMyTasks(roomId?: string | null, userId?: string) {
  return useQuery({
    queryKey: HOUSEHOLD_KEYS.myTasks(roomId ?? '', userId ?? ''),
    queryFn: () => householdApi.myTasks(roomId!, userId!),
    enabled: !!roomId && !!userId,
  });
}

export function usePendingReviewTasks(roomId?: string | null, userId?: string) {
  return useQuery({
    queryKey: HOUSEHOLD_KEYS.pendingReview(roomId ?? '', userId ?? ''),
    queryFn: () => householdApi.pendingReviewTasks(roomId!, userId!),
    enabled: !!roomId && !!userId,
  });
}

export function useTaskDetail(taskId?: string) {
  return useQuery({
    queryKey: HOUSEHOLD_KEYS.taskDetail(taskId ?? ''),
    queryFn: () => householdApi.taskDetail(taskId!),
    enabled: !!taskId,
  });
}

export function useWeekBoard(roomId?: string | null) {
  return useQuery({
    queryKey: HOUSEHOLD_KEYS.weekBoard(roomId ?? ''),
    queryFn: () => householdApi.weekBoard(roomId!),
    enabled: !!roomId,
  });
}

export function useKarmaBalance(userId?: string) {
  return useQuery({
    queryKey: HOUSEHOLD_KEYS.karma(userId ?? ''),
    queryFn: () => householdApi.karmaBalance(userId!),
    enabled: !!userId,
  });
}

export function useChoreTemplates(roomId?: string | null) {
  return useQuery({
    queryKey: HOUSEHOLD_KEYS.templates(roomId ?? ''),
    queryFn: () => householdApi.choreTemplates(roomId!),
    enabled: !!roomId,
  });
}

// Mutations
export function useHouseholdMutations(roomId?: string | null) {
  const queryClient = useQueryClient();

  const invalidateHousehold = () => {
    if (roomId) {
      queryClient.invalidateQueries({ queryKey: HOUSEHOLD_KEYS.openTasks(roomId) });
      queryClient.invalidateQueries({ queryKey: HOUSEHOLD_KEYS.weekBoard(roomId) });
      queryClient.invalidateQueries({ queryKey: HOUSEHOLD_KEYS.members(roomId) });
    }
    queryClient.invalidateQueries({ queryKey: HOUSEHOLD_KEYS.all });
  };

  const createRoom = useMutation({
    mutationFn: (name: string) => householdApi.createRoom(name),
    onSuccess: invalidateHousehold,
  });

  const joinRoom = useMutation({
    mutationFn: (code: string) => householdApi.joinRoom(code),
    onSuccess: invalidateHousehold,
  });

  const leaveRoom = useMutation({
    mutationFn: (params: { roomId: string; newHostId?: string | null }) =>
      householdApi.leaveRoom(params.roomId, params.newHostId),
    onSuccess: invalidateHousehold,
  });

  const createAdhocTask = useMutation({
    mutationFn: (params: {
      roomId: string;
      title: string;
      category: TaskCategory;
      effortPoints: number;
      dueAt: string;
      requiresPhoto?: boolean;
    }) => householdApi.createAdhocTask(params),
    onSuccess: invalidateHousehold,
  });

  const claimTask = useMutation({
    mutationFn: (taskId: string) => householdApi.claimTask(taskId),
    onSuccess: invalidateHousehold,
  });

  const submitTaskWithPhoto = useMutation({
    mutationFn: async (params: {
      taskId: string;
      roomId: string;
      imageUri?: string | null;
    }) => {
      let photoPath: string | null = null;

      if (params.imageUri) {
        // Nén ảnh <= 1MB (ARCH Mục 15.3)
        const manipResult = await ImageManipulator.manipulateAsync(
          params.imageUri,
          [{ resize: { width: 1280 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpg`;
        // Đường dẫn bắt buộc bắt đầu bằng roomId (Storage RLS policy Mục 4.7)
        photoPath = `${params.roomId}/${params.taskId}/${fileName}`;

        const response = await fetch(manipResult.uri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('task-photos')
          .upload(photoPath, blob, { contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;
      }

      return householdApi.submitTask(params.taskId, photoPath);
    },
    onSuccess: invalidateHousehold,
  });

  const requestNudge = useMutation({
    mutationFn: (taskId: string) => householdApi.requestNudge(taskId),
    onSuccess: invalidateHousehold,
  });

  const disputeTask = useMutation({
    mutationFn: (params: { taskId: string; reasonCode: string; reason?: string | null }) =>
      householdApi.disputeTask(params.taskId, params.reasonCode, params.reason),
    onSuccess: invalidateHousehold,
  });

  const proposeChoreTemplate = useMutation({
    mutationFn: householdApi.proposeChoreTemplate,
    onSuccess: invalidateHousehold,
  });

  const approveChoreTemplate = useMutation({
    mutationFn: householdApi.approveChoreTemplate,
    onSuccess: invalidateHousehold,
  });

  const requestSwap = useMutation({
    mutationFn: (taskId: string) => householdApi.requestSwap(taskId),
    onSuccess: invalidateHousehold,
  });

  const acceptSwap = useMutation({
    mutationFn: (swapId: string) => householdApi.acceptSwap(swapId),
    onSuccess: invalidateHousehold,
  });

  const resolveDispute = useMutation({
    mutationFn: (params: { taskId: string; decision: 'uphold' | 'dismiss' }) =>
      householdApi.resolveDispute(params.taskId, params.decision),
    onSuccess: invalidateHousehold,
  });

  const setAwayMode = useMutation({
    mutationFn: (params: { roomId: string; from: string; to: string }) =>
      householdApi.setAwayMode(params.roomId, params.from, params.to),
    onSuccess: invalidateHousehold,
  });

  const clearAwayMode = useMutation({
    mutationFn: (roomId: string) => householdApi.clearAwayMode(roomId),
    onSuccess: invalidateHousehold,
  });

  const redeemKarma = useMutation({
    mutationFn: (params: { roomId: string; rewardType?: string }) =>
      householdApi.redeemKarma(params.roomId, params.rewardType),
    onSuccess: invalidateHousehold,
  });

  return {
    createRoom,
    joinRoom,
    leaveRoom,
    createAdhocTask,
    claimTask,
    submitTaskWithPhoto,
    requestNudge,
    disputeTask,
    proposeChoreTemplate,
    approveChoreTemplate,
    requestSwap,
    acceptSwap,
    resolveDispute,
    setAwayMode,
    clearAwayMode,
    redeemKarma,
  };
}
