import { supabase } from '../../lib/supabase';
import { callRpc, AppError } from '../../lib/rpc';
import { vnWeekStart } from '../../lib/time';
import type { TaskInstance, TaskCategory } from '@duebro/shared-types';

export const householdApi = {
  // Queries (Client SELECT qua RLS view/table)
  myRooms: async (userId: string) => {
    const { data, error } = await supabase
      .from('room_members')
      .select('role, away_status, away_from, away_to, rooms(*)')
      .eq('member_id', userId)
      .is('left_at', null);

    if (error) throw error;
    return (data || []).map((rm: any) => ({
      role: rm.role,
      away_status: rm.away_status,
      room: rm.rooms,
    }));
  },

  roomMembers: async (roomId: string) => {
    // 1. Get active members
    const { data: members, error: mError } = await supabase
      .from('room_members')
      .select('member_id, role, joined_at, away_status, away_from, away_to')
      .eq('room_id', roomId)
      .is('left_at', null);

    if (mError) throw mError;
    if (!members || members.length === 0) return [];

    const memberIds = members.map((m) => m.member_id);

    // 2. Join profiles_public (ARCH Mục 15.3: không select bảng profiles gốc)
    const { data: profiles, error: pError } = await supabase
      .from('profiles_public')
      .select('id, display_name, avatar_url')
      .in('id', memberIds);

    if (pError) throw pError;

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    return members.map((m) => ({
      ...m,
      profile: profileMap.get(m.member_id) || {
        id: m.member_id,
        display_name: 'Bro Bạn Phòng',
        avatar_url: null,
      },
    }));
  },

  openTasks: async (roomId: string): Promise<TaskInstance[]> => {
    const { data, error } = await supabase
      .from('task_instances')
      .select('*')
      .eq('room_id', roomId)
      .eq('status', 'open')
      .order('due_at', { ascending: true });

    if (error) throw error;
    return (data as TaskInstance[]) || [];
  },

  myTasks: async (roomId: string, userId: string): Promise<TaskInstance[]> => {
    const { data, error } = await supabase
      .from('task_instances')
      .select('*')
      .eq('room_id', roomId)
      .eq('claimed_by', userId)
      .in('status', ['claimed', 'assigned', 'pending_approval', 'disputed'])
      .order('due_at', { ascending: true });

    if (error) throw error;
    return (data as TaskInstance[]) || [];
  },

  pendingReviewTasks: async (roomId: string, userId: string): Promise<TaskInstance[]> => {
    const { data, error } = await supabase
      .from('task_instances')
      .select('*')
      .eq('room_id', roomId)
      .eq('status', 'pending_approval')
      .neq('claimed_by', userId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return (data as TaskInstance[]) || [];
  },

  taskDetail: async (taskId: string) => {
    const { data: task, error: tError } = await supabase
      .from('task_instances')
      .select('*')
      .eq('id', taskId)
      .single();

    if (tError) throw tError;

    // Photos (Lấy ảnh mới nhất theo created_at desc)
    const { data: photos } = await supabase
      .from('task_photos')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    // Get signed URL for photo if exists
    let photoSignedUrl: string | null = null;
    if (photos && photos.length > 0) {
      const latestPhoto = photos[0];
      const { data: signedData, error: sError } = await supabase.storage
        .from('task-photos')
        .createSignedUrl(latestPhoto.storage_path, 86400); // 24 giờ
      
      if (!sError && signedData?.signedUrl) {
        photoSignedUrl = signedData.signedUrl;
      } else {
        const { data: publicData } = supabase.storage
          .from('task-photos')
          .getPublicUrl(latestPhoto.storage_path);
        photoSignedUrl = publicData?.publicUrl ?? null;
      }
    }

    // Public disputes (ẩn danh - ARCH Mục 15.3)
    const { data: disputes } = await supabase
      .from('disputes_public')
      .select('*')
      .eq('task_id', taskId);

    // Nudge counts (ẩn danh)
    const { data: nudges } = await supabase
      .from('nudge_counts')
      .select('*')
      .eq('task_id', taskId)
      .maybeSingle();

    return {
      task: task as TaskInstance,
      photos: photos || [],
      photoSignedUrl,
      disputes: disputes || [],
      nudgeCount: nudges?.nudge_count || 0,
    };
  },

  weekBoard: async (roomId: string) => {
    const currentWeekStart = vnWeekStart();
    const { data: progress, error: prgError } = await supabase
      .from('weekly_quota_progress')
      .select('*')
      .eq('room_id', roomId)
      .eq('week_start', currentWeekStart);

    if (prgError) throw prgError;

    const { data: targets, error: tgtError } = await supabase
      .from('weekly_quota_targets')
      .select('*')
      .eq('room_id', roomId)
      .eq('week_start', currentWeekStart);

    if (tgtError) throw tgtError;

    const targetMap = new Map((targets || []).map((t) => [t.member_id, t.target_points]));
    return (progress || []).map((p) => ({
      member_id: p.member_id,
      achieved_points: p.achieved_points ?? 0,
      target_points: targetMap.get(p.member_id) ?? 60,
    }));
  },

  karmaBalance: async (userId: string): Promise<number> => {
    const { data, error } = await supabase
      .from('point_ledger')
      .select('amount')
      .eq('member_id', userId)
      .eq('point_type', 'karma_permanent');

    if (error) return 0;
    return (data || []).reduce((acc, row) => acc + (row.amount || 0), 0);
  },

  choreTemplates: async (roomId: string) => {
    const { data, error } = await supabase
      .from('chore_templates')
      .select('*')
      .eq('room_id', roomId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  },

  // RPC Actions (Mọi thay đổi trạng thái đều qua RPC)
  createRoom: async (name: string) => {
    return callRpc<any>('create_room', { p_name: name });
  },

  joinRoom: async (inviteCode: string) => {
    return callRpc<any>('join_room', { p_invite_code: inviteCode.trim().toUpperCase() });
  },

  leaveRoom: async (roomId: string, newHostId?: string | null) => {
    return callRpc<void>('leave_room', { p_room_id: roomId, p_new_host_id: newHostId || null });
  },

  createAdhocTask: async (params: {
    roomId: string;
    title: string;
    category: TaskCategory;
    effortPoints: number;
    dueAt: string;
    requiresPhoto?: boolean;
  }) => {
    return callRpc<any>('create_adhoc_task', {
      p_room_id: params.roomId,
      p_title: params.title,
      p_category: params.category,
      p_effort_points: params.effortPoints,
      p_due_at: params.dueAt,
    });
  },

  claimTask: async (taskId: string) => {
    return callRpc<TaskInstance>('claim_task', { p_task_id: taskId });
  },

  submitTask: async (taskId: string, photoPath?: string | null) => {
    return callRpc<TaskInstance>('submit_task', {
      p_task_id: taskId,
      p_photo_path: photoPath || null,
    });
  },

  requestNudge: async (taskId: string) => {
    return callRpc<void>('request_nudge', { p_task_id: taskId });
  },

  disputeTask: async (taskId: string, reasonCode: string, reason?: string | null) => {
    return callRpc<TaskInstance>('dispute_task', {
      p_task_id: taskId,
      p_reason_code: reasonCode,
      p_reason: reason || null,
    });
  },

  proposeChoreTemplate: async (params: {
    roomId: string;
    title: string;
    description?: string;
    category: TaskCategory;
    effortPoints: number;
    frequency?: string;
    assignedTo?: string | null;
    dueTime?: string;
    requiresPhoto?: boolean;
  }) => {
    return callRpc<any>('propose_chore_template', {
      p_room_id: params.roomId,
      p_name: params.title,
      p_category: params.category,
      p_default_effort_points: params.effortPoints,
      p_estimated_minutes: 20,
      p_recurrence_rule: params.frequency || 'FREQ=WEEKLY',
      p_requires_photo: params.requiresPhoto ?? (params.effortPoints >= 30),
    });
  },

  approveChoreTemplate: async (templateId: string) => {
    return callRpc<any>('approve_chore_template', { p_template_id: templateId });
  },

  // P1 Advanced Actions
  requestSwap: async (taskId: string) => {
    return callRpc<any>('request_swap', { p_task_id: taskId });
  },

  acceptSwap: async (swapId: string) => {
    return callRpc<TaskInstance>('accept_swap', { p_swap_id: swapId });
  },

  cancelSwap: async (swapId: string) => {
    return callRpc<void>('cancel_swap', { p_swap_id: swapId });
  },

  resolveDispute: async (taskId: string, decision: 'uphold' | 'dismiss') => {
    return callRpc<TaskInstance>('resolve_dispute', {
      p_task_id: taskId,
      p_decision: decision,
    });
  },

  setAwayMode: async (roomId: string, fromDate: string, toDate: string) => {
    if (!roomId) throw new AppError('Chưa chọn phòng hoặc mã phòng không hợp lệ.');
    return callRpc<any>('set_away_mode', {
      p_room_id: roomId,
      p_from: fromDate,
      p_to: toDate,
    });
  },

  clearAwayMode: async (roomId: string) => {
    if (!roomId) throw new AppError('Chưa chọn phòng hoặc mã phòng không hợp lệ.');
    return callRpc<any>('clear_away_mode', { p_room_id: roomId });
  },

  redeemKarma: async (roomId: string, rewardType: string = 'skip_next_task') => {
    return callRpc<any>('redeem_karma', {
      p_room_id: roomId,
      p_reward_type: rewardType,
    });
  },
};
