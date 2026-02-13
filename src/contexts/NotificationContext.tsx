import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getNotifications, markAllAsRead, markAsRead, Notification } from '@/services/notifications';
import { getUnreadCount } from '@/services/chat';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  unreadMessages: number; // Mantendo compatibilidade
  removeNotification: (id: string) => void; // Mantendo compatibilidade
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await getNotifications(user.id);
    if (data) {
      setNotifications(data as Notification[]);
    }
    setLoading(false);
    updateChatCount();
  };

  const updateChatCount = async () => {
    const { count } = await getUnreadCount();
    setUnreadMessages(count || 0);
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Realtime listener for Notifications Table
      const notificationChannel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            setNotifications((prev) => [newNotification, ...prev]);

            toast({
              title: newNotification.title,
              description: newNotification.message,
              variant: newNotification.type === 'error' ? 'destructive' : 'default',
            });

            try {
              new Audio('/notification.mp3').play().catch(() => { });
            } catch (e) { }
          }
        )
        .subscribe();

      // Realtime listener for Chat Messages (to update badge)
      const chatChannel = supabase
        .channel('notifications-chat-count')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
          updateChatCount();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(notificationChannel);
        supabase.removeChannel(chatChannel);
      };
    } else {
      setNotifications([]);
    }
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await markAllAsRead(user.id);
  };

  const handleRemoveNotification = (id: string) => {
    // Not implemented in DB yet, acting as "Read" or local hide
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      refreshNotifications: fetchNotifications,
      markAsRead: handleMarkAsRead,
      markAllAsRead: handleMarkAllAsRead,
      unreadMessages,
      removeNotification: handleRemoveNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
