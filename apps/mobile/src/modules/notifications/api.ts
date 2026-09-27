import { supabase } from '../../lib/supabase';
import type { NotificationLogItem } from '@duebro/shared-types';

export const notificationsApi = {
  getMyNotifications: async (userId: string): Promise<NotificationLogItem[]> => {
    const { data, error } = await supabase
      .from('notifications_log')
      .select('*')
      .eq('recipient_id', userId)
      .order('sent_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return (data as NotificationLogItem[]) || [];
  },
};
