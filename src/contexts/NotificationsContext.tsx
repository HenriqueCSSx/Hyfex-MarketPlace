import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getNotifications, markAllAsRead, markAsRead, Notification } from '@/services/notifications';

interface NotificationsContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    refreshNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        if (!user) return;
        setLoading(true);
        const { data } = await getNotifications(user.id);
        if (data) {
            setNotifications(data as Notification[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();

            // Realtime listener
            const channel = supabase
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

                        // Show toast immediately
                        toast({
                            title: newNotification.title,
                            description: newNotification.message,
                            variant: newNotification.type === 'error' ? 'destructive' : 'default',
                        });

                        // Play sound (optional, simple beep)
                        try {
                            new Audio('/notification.mp3').play().catch(() => { }); // If exists
                        } catch (e) { }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        } else {
            setNotifications([]);
        }
    }, [user]);

    const handleMarkAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        await markAsRead(id);
    };

    const handleMarkAllAsRead = async () => {
        if (!user) return;
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        await markAllAsRead(user.id);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationsContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            refreshNotifications: fetchNotifications,
            markAsRead: handleMarkAsRead,
            markAllAsRead: handleMarkAllAsRead
        }}>
            {children}
        </NotificationsContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationsContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationsProvider');
    }
    return context;
};
