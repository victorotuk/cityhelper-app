import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  // Fetch user's notifications
  fetchNotifications: async (userId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error && error.code !== '42P01') throw error;
      
      const notifications = data || [];
      const unreadCount = notifications.filter(n => !n.read).length;
      
      set({ notifications, unreadCount, loading: false });
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      set({ loading: false });
    }
  },

  // Add a new in-app notification
  addNotification: async (userId, { title, message, type = 'info', link = null }) => {
    try {
      const notification = {
        user_id: userId,
        title,
        message,
        type, // 'info', 'warning', 'deadline', 'update'
        link,
        read: false,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert([notification])
        .select()
        .single();

      if (error && error.code !== '42P01') throw error;

      if (data) {
        set(state => ({
          notifications: [data, ...state.notifications],
          unreadCount: state.unreadCount + 1
        }));
      }

      return data;
    } catch (err) {
      console.error('Failed to add notification:', err);
      return null;
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  },

  // Mark all as read
  markAllAsRead: async (userId) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  },

  // Clear old notifications (keep last 30 days)
  clearOld: async (userId) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .lt('created_at', thirtyDaysAgo.toISOString());
    } catch (err) {
      console.error('Failed to clear old notifications:', err);
    }
  }
}));

