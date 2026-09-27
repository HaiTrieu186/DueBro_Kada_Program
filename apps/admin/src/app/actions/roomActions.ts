'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabaseServer';

export interface CreateRoomInput {
  name: string;
  maxMembers?: number;
  mascotName?: string;
}

export async function createRoomAction(input: CreateRoomInput) {
  try {
    const name = input.name?.trim();
    if (!name || name.length < 2) {
      return { success: false, error: 'Tên phòng phải có ít nhất 2 ký tự' };
    }

    const maxMembers = Math.min(Math.max(input.maxMembers || 4, 2), 12);
    const mascotName = input.mascotName?.trim() || 'Bro';

    const supabase = createAdminClient();

    // 1. Fetch admin user id or system fallback
    const { data: usersData, error: userErr } = await supabase.auth.admin.listUsers();
    let creatorId: string | null = null;

    if (!userErr && usersData?.users && usersData.users.length > 0) {
      const opsUser = usersData.users.find(
        (u) => u.app_metadata?.role === 'ops' || u.email === 'admin@duebro.vn'
      );
      creatorId = opsUser ? opsUser.id : usersData.users[0].id;
    }

    if (!creatorId) {
      // Find any profile in profiles table
      const { data: profile } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
      if (profile) {
        creatorId = profile.id;
      }
    }

    if (!creatorId) {
      return { success: false, error: 'Không tìm thấy profile admin để gán tạo phòng' };
    }

    // 2. Generate unique 6-character uppercase code
    let inviteCode = '';
    let inserted = false;
    let attempts = 0;
    let newRoom: any = null;

    while (!inserted && attempts < 10) {
      attempts++;
      inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data, error } = await supabase
        .from('rooms')
        .insert({
          name,
          invite_code: inviteCode,
          created_by: creatorId,
          max_members: maxMembers,
          mascot_name: mascotName,
          is_pro: false,
        })
        .select()
        .single();

      if (!error && data) {
        inserted = true;
        newRoom = data;
      } else if (error && error.code !== '23505') {
        // Not a unique violation
        console.error('Lỗi tạo phòng:', error);
        return { success: false, error: error.message };
      }
    }

    if (!inserted) {
      return { success: false, error: 'Không thể tạo mã mời độc nhất, vui lòng thử lại' };
    }

    // 3. Add creator as host member
    await supabase.from('room_members').upsert({
      room_id: newRoom.id,
      member_id: creatorId,
      role: 'host',
      away_status: 'active',
    });

    revalidatePath('/');
    revalidatePath('/rooms');

    return {
      success: true,
      room: {
        id: newRoom.id,
        name: newRoom.name,
        inviteCode: newRoom.invite_code,
        maxMembers: newRoom.max_members,
      },
    };
  } catch (err: any) {
    console.error('Error in createRoomAction:', err);
    return { success: false, error: err.message || 'Lỗi hệ thống khi tạo phòng' };
  }
}
