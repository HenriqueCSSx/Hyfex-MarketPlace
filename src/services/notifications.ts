import { supabase } from "@/lib/supabase";

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    link?: string;
    read: boolean;
    created_at: string;
}

export const getNotifications = async (userId: string) => {
    const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

    return { data, error };
};

export const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

    return { error };
};

export const markAllAsRead = async (userId: string) => {
    const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false);

    return { error };
};

export const createNotification = async (
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    link?: string
) => {
    const { error } = await supabase
        .from("notifications")
        .insert({
            user_id: userId,
            title,
            message,
            type,
            link
        });

    return { error };
};
