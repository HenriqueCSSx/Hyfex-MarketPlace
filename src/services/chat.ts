import { supabase } from "@/lib/supabase";

export interface ChatConversation {
    id: string;
    participantName: string;
    participantRole: "cliente" | "vendedor" | "fornecedor";
    lastMessage: string;
    lastMessageTime: string;
    unread: number;
    productTitle?: string;
    productImage?: string;
    productId?: string;
    otherUserId: string;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: string;
    read: boolean;
    createdAt: string;
}

export async function getConversations() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    // Fetch conversations with participants and product info
    const { data, error } = await supabase
        .from("conversations")
        .select(`
            *,
            product:products(id, title, image_url),
            buyer:profiles!conversations_buyer_id_fkey(id, name),
            seller:profiles!conversations_seller_id_fkey(id, name),
            messages(content, created_at, sender_id, read_at)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

    if (error) return { data, error };

    const formatted: ChatConversation[] = data.map((c: any) => {
        const isBuyer = c.buyer_id === user.id;
        const otherUser = isBuyer ? c.seller : c.buyer;
        const otherUserId = isBuyer ? c.seller_id : c.buyer_id;
        const role = isBuyer ? "vendedor" : "cliente";

        // Get messages sorted by date descending to find last one
        const sortedMessages = (c.messages || []).sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const lastMsg = sortedMessages[0];

        // Count unread messages from other user
        const unreadCount = (c.messages || []).filter((m: any) =>
            m.sender_id !== user.id && !m.read_at
        ).length;

        return {
            id: c.id,
            participantName: otherUser?.name || "Usuário",
            participantRole: otherUser?.activeRole || role, // Use profile activeRole if possible? Or context role.
            lastMessage: lastMsg?.content || "Nova conversa",
            lastMessageTime: lastMsg?.created_at
                ? new Date(lastMsg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                : "",
            unread: unreadCount,
            productTitle: c.product?.title,
            productImage: c.product?.image_url,
            productId: c.product_id,
            otherUserId
        };
    });

    return { data: formatted, error: null };
}

export async function getMessages(conversationId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

    if (error) return { data, error };

    const formatted: ChatMessage[] = data.map((m: any) => ({
        id: m.id,
        senderId: m.sender_id === user.id ? "me" : "other",
        text: m.content,
        timestamp: new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        read: !!m.read_at,
        createdAt: m.created_at
    }));

    return { data: formatted, error };
}

export async function sendMessage(conversationId: string, content: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from("messages")
        .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content
        })
        .select()
        .single();

    return { data, error };
}

export async function createConversation(otherUserId: string, productId?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    let query = supabase
        .from("conversations")
        .select("id")
        .or(`and(buyer_id.eq.${user.id},seller_id.eq.${otherUserId}),and(buyer_id.eq.${otherUserId},seller_id.eq.${user.id})`);

    if (productId) {
        query = query.eq("product_id", productId);
    } else {
        query = query.is("product_id", null);
    }

    const { data: existing, error: searchError } = await query;

    if (existing && existing.length > 0) {
        return { data: existing[0], error: null };
    }

    const { data, error } = await supabase
        .from("conversations")
        .insert({
            buyer_id: user.id,
            seller_id: otherUserId,
            product_id: productId
        })
        .select()
        .single();

    return { data, error };
}

export async function markAsRead(conversationId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .is("read_at", null);

    return { data, error };
}

export async function getUnreadCount() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { count: 0, error: { message: "Not authenticated" } };

    const { count, error } = await supabase
        .from("messages")
        .select("*", { count: 'exact', head: true })
        .is("read_at", null)
        .neq("sender_id", user.id);

    return { count: count || 0, error };
}
