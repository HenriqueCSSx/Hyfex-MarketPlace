import { supabase } from "@/lib/supabase";

export interface SupportTicket {
    id: string;
    subject: string;
    description: string;
    category: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    created_at: string;
    updated_at: string;
    user_id: string;
}

export interface SupportMessage {
    id: string;
    ticket_id: string;
    message: string;
    is_staff: boolean;
    created_at: string;
    sender_id: string;
    sender_name?: string; // joined
    sender_avatar?: string; // joined
}

// Create Ticket
export async function createTicket(ticket: {
    subject: string;
    description: string;
    category: string;
    priority?: string;
}) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from("support_tickets")
        .insert({
            ...ticket,
            user_id: user.id,
            status: 'open',
            priority: ticket.priority || 'medium'
        })
        .select()
        .single();

    return { data, error };
}

// Get Tickets
export async function getMyTickets() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    return { data, error };
}

// Get Single Ticket details
export async function getTicketDetails(id: string) {
    const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("id", id)
        .single();

    return { data, error };
}

// Get Messages for a Ticket
export async function getTicketMessages(ticketId: string) {
    const { data, error } = await supabase
        .from("support_messages")
        .select(`
            *,
            sender:profiles!sender_id (name, avatar_url)
        `)
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

    return { data, error };
}

// Send Message (Reply)
export async function sendTicketMessage(ticketId: string, message: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from("support_messages")
        .insert({
            ticket_id: ticketId,
            sender_id: user.id,
            message,
            is_staff: false
        })
        .select()
        .single();

    // Also update ticket updated_at
    if (!error) {
        await supabase
            .from("support_tickets")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", ticketId);
    }

    return { data, error };
}
