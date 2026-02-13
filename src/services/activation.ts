import { supabase } from "@/lib/supabase";
import { uploadImage } from "./storage";

export interface ActivationMessage {
    id: string;
    user_id: string;
    sender_id: string;
    message?: string;
    image_url?: string;
    created_at: string;
    sender?: { name: string; avatar_url?: string };
}

export interface ActivationRequest {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    status: string;
    activation_requested: boolean;
    created_at: string;
    last_message?: string;
    last_message_at?: string;
    unread_count?: number;
}

// Request activation (seller side)
export async function requestActivation() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: "Not authenticated" } };

    const { error } = await supabase
        .from("profiles")
        .update({ activation_requested: true })
        .eq("id", user.id);

    return { error };
}

// Send a message in activation chat
export async function sendActivationMessage(userId: string, message?: string, imageFile?: File) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: "Not authenticated" } };

    let image_url: string | undefined;

    if (imageFile) {
        const { publicUrl, error: uploadError } = await uploadImage(imageFile, "activation-proofs");
        if (uploadError) return { error: { message: uploadError } };
        image_url = publicUrl || undefined;
    }

    const { data, error } = await supabase
        .from("activation_chats")
        .insert({
            user_id: userId,
            sender_id: user.id,
            message: message || null,
            image_url: image_url || null,
        })
        .select()
        .single();

    return { data, error };
}

// Get activation chat messages for a specific user
export async function getActivationMessages(userId: string) {
    const { data, error } = await supabase
        .from("activation_chats")
        .select(`
            *,
            sender:profiles!activation_chats_sender_id_fkey(name, avatar_url)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

    return { data: data as ActivationMessage[] | null, error };
}

// Get all users who requested activation (admin side)
export async function getActivationRequests() {
    const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, avatar_url, status, activation_requested, created_at")
        .eq("activation_requested", true)
        .order("created_at", { ascending: false });

    if (error) return { data: null, error };

    // Enrich with last message info
    const enriched = await Promise.all(
        (data || []).map(async (user: any) => {
            const { data: msgs } = await supabase
                .from("activation_chats")
                .select("message, created_at")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(1);

            return {
                ...user,
                last_message: msgs?.[0]?.message || null,
                last_message_at: msgs?.[0]?.created_at || null,
            };
        })
    );

    return { data: enriched as ActivationRequest[], error: null };
}

// Activate a user's account (admin side)
export async function activateUserAccount(userId: string) {
    // Update user status to active
    const { error: statusError } = await supabase
        .from("profiles")
        .update({
            status: "active",
            activation_requested: false,
        })
        .eq("id", userId);

    if (statusError) return { error: statusError };

    // Also unsuspend any products that were suspended
    const { error: prodError } = await supabase
        .from("products")
        .update({ status: "approved" })
        .eq("seller_id", userId)
        .eq("status", "suspended");

    return { error: prodError };
}
