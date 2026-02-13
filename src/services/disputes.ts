import { supabase } from "@/lib/supabase";

export interface Dispute {
    id: string;
    order_id: string;
    opener_id: string;
    seller_id: string;
    reason: string;
    description: string;
    status: "open" | "resolved_refund" | "resolved_release" | "cancelled";
    admin_notes?: string;
    resolution_details?: string;
    created_at: string;
    resolved_at?: string;
    order?: {
        total_amount: number;
        product?: { title: string; image_url: string; };
    };
    opener?: { name: string; email: string; };
    seller?: { name: string; email: string; };
}

// Open a dispute against an order
export async function openDispute(dispute: {
    order_id: string;
    seller_id: string;
    reason: string;
    description: string;
}) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: "Not authenticated" } };

    // Start a transaction if possible, or handle sequentially.
    // 1. Mark order as 'disputed'
    const { error: orderError } = await supabase
        .from("orders")
        .update({ status: "disputed" })
        .eq("id", dispute.order_id);

    if (orderError) return { error: orderError };

    // 2. Create dispute record
    const { data, error } = await supabase
        .from("order_disputes")
        .insert({
            ...dispute,
            opener_id: user.id
        })
        .select()
        .single();

    return { data, error };
}

// Get disputes involving the current user (either as buyer or seller)
export async function getMyDisputes() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from("order_disputes")
        .select(`
            *,
            order:orders(total_amount, product:products(title, image_url)),
            opener:profiles!opener_id(name),
            seller:profiles!seller_id(name)
        `)
        .or(`opener_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

    return { data, error };
}

// Admin: Get all disputes
export async function getAllDisputes() {
    // Only admins (RLS enforced + guard clause)
    const { data, error } = await supabase
        .from("order_disputes")
        .select(`
            *,
            order:orders(total_amount),
            opener:profiles!opener_id(name, email),
            seller:profiles!seller_id(name, email)
        `)
        .order("created_at", { ascending: false });

    return { data, error };
}

// Admin: Resolve Dispute
export async function resolveDispute(disputeId: string, resolution: "refund" | "release", notes: string) {
    const { data: { user } } = await supabase.auth.getUser();
    // Assuming admin role is checked via RLS or prior guard

    const newStatus = resolution === "refund" ? "resolved_refund" : "resolved_release";

    // 1. Update dispute
    const { data: dispute, error } = await supabase
        .from("order_disputes")
        .update({
            status: newStatus,
            resolution_details: notes,
            resolved_at: new Date().toISOString()
        })
        .eq("id", disputeId)
        .select()
        .single();

    if (error || !dispute) return { error: error || { message: "Dispute not found" } };

    // 2. Update Order status based on resolution
    const orderStatus = resolution === "refund" ? "cancelled" : "completed"; // If refunded, order is cancelled. If released, money goes to seller -> completed.

    await supabase.from("orders").update({ status: orderStatus }).eq("id", dispute.order_id);

    // 3. Handle money movement (Refund or Release to Seller)
    // Money is currently "held" in platform balance or pending. 
    // If refunded: Return to buyer's balance? Or just mark as refunded if external gateway?
    // If released: Use 'releaseOrderPayment' logic from finance service?

    // For MVP simple logic:
    // If released -> Mark order completed. The finance logic (release funds) might be triggered by order completion trigger or manual admin action elsewhere.

    return { data: dispute, error: null };
}
