import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AppNotification {
  id: number;
  user_id: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
  expires_at?: string | null;
  type_id?: number | null;
  notification_type?: {
    type_key?: string;
    display_name?: string;
  } | null;
}

export function useNotifications(limit = 25) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          user_id,
          message,
          metadata,
          is_read,
          created_at,
          expires_at,
          type_id,
          notification_type:notification_types(type_key, display_name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setNotifications((data as AppNotification[]) || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    const { data, error } = await supabase.rpc('mark_notification_read' as any, {
      p_notification_id: notificationId,
    });

    if (error) throw error;
    await fetchNotifications();
    return data;
  };

  const markAllAsRead = async () => {
    const { data, error } = await supabase.rpc('mark_all_notifications_read' as any);

    if (error) throw error;
    await fetchNotifications();
    return data;
  };

  useEffect(() => {
    fetchNotifications();

    const intervalId = window.setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [limit]);

  return {
    notifications,
    loading,
    unreadCount: notifications.filter((item) => !item.is_read).length,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
