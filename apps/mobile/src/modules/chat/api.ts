import { supabase } from '../../lib/supabase';
import { callRpc } from '../../lib/rpc';

export const chatApi = {
  getConnections: async (userId: string) => {
    const { data: connections, error } = await supabase
      .from('match_connections')
      .select('*')
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!connections || connections.length === 0) return [];

    // Find other user IDs
    const otherUserIds = connections.map((c) =>
      c.user_a_id === userId ? c.user_b_id : c.user_a_id
    );

    const { data: profiles } = await supabase
      .from('profiles_public')
      .select('*')
      .in('id', otherUserIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    return connections.map((c) => {
      const otherId = c.user_a_id === userId ? c.user_b_id : c.user_a_id;
      return {
        ...c,
        otherUser: profileMap.get(otherId) || {
          id: otherId,
          display_name: 'Roommate Bro',
          avatar_url: null,
        },
      };
    });
  },

  getMessages: async (connectionId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  sendMessage: async (connectionId: string, content: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Chưa đăng nhập');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        connection_id: connectionId,
        sender_id: user.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  proposeRoom: async (connectionId: string, roomName: string) => {
    return callRpc<any>('propose_room', {
      p_connection_id: connectionId,
      p_room_name: roomName,
    });
  },

  acceptRoom: async (connectionId: string) => {
    return callRpc<any>('accept_room', {
      p_connection_id: connectionId,
    });
  },
};
