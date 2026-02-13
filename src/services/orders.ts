import { supabase } from "@/lib/supabase";

// ============================================
// ORDERS SERVICE
// ============================================

// Create a new order (buy a product)
export async function createOrder(order: {
    product_id: string;
    seller_id: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
}) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from("orders")
        .insert({ ...order, buyer_id: user.id })
        .select(`
      *,
      product:products(id, title, image_url),
      seller:profiles!orders_seller_id_fkey(id, name)
    `)
        .single();

    return { data, error };
}

// Get orders as buyer
export async function getMyPurchases() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from("orders")
        .select(`
      *,
      product:products(id, title, image_url, type),
      seller:profiles!orders_seller_id_fkey(id, name)
    `)
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });

    return { data, error };
}

// Get orders as seller
export async function getMySales() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from("orders")
        .select(`
      *,
      product:products(id, title, image_url, type),
      buyer:profiles!orders_buyer_id_fkey(id, name)
    `)
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

    return { data, error };
}

// Mark order as completed (seller delivers)
export async function completeOrder(orderId: string) {
    const { data, error } = await supabase
        .from("orders")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", orderId)
        .select()
        .single();

    return { data, error };
}

// ============================================
// DISPUTES SERVICE
// ============================================

export async function createDispute(dispute: {
    order_id: string;
    product_id: string;
    seller_id: string;
    amount: number;
    reason: string;
}) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from("disputes")
        .insert({ ...dispute, buyer_id: user.id })
        .select()
        .single();

    return { data, error };
}

export async function getMyDisputes() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from("disputes")
        .select(`
      *,
      product:products(id, title),
      buyer:profiles!disputes_buyer_id_fkey(id, name),
      seller:profiles!disputes_seller_id_fkey(id, name),
      messages:dispute_messages(*)
    `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

    return { data, error };
}

export async function sendDisputeMessage(disputeId: string, message: string, senderType: "buyer" | "seller") {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from("dispute_messages")
        .insert({
            dispute_id: disputeId,
            sender_id: user.id,
            sender_type: senderType,
            message,
        })
        .select()
        .single();

    return { data, error };
}

// ============================================
// SUBSCRIPTIONS SERVICE
// ============================================

export async function getMySubscription() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    return { data, error };
}

export async function createSubscription(plan: "monthly" | "free") {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const amount = plan === "monthly" ? 29.90 : 0;

    const { data, error } = await supabase
        .from("subscriptions")
        .insert({
            user_id: user.id,
            status: plan === "free" ? "free" : "pending",
            plan,
            amount,
            auto_renew: plan === "monthly",
        })
        .select()
        .single();

    return { data, error };
}
