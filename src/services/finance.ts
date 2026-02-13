
import { supabase } from "@/lib/supabase";

export interface FinancialDetails {
    user_id?: string;
    pix_key: string;
    pix_key_type: string;
    cpf: string;
    full_name: string;
    created_at?: string;
}

export interface Withdrawal {
    id: string;
    user_id: string;
    amount: number;
    status: "pending" | "paid" | "rejected";
    pix_key: string;
    cpf: string;
    full_name: string;
    created_at: string;
    paid_at?: string;
    admin_note?: string;
    user?: {
        name: string;
        email: string;
    };
}

export async function getFinancialDetails(userId: string) {
    const { data, error } = await supabase
        .from("seller_financials")
        .select("*")
        .eq("user_id", userId)
        .single();
    return { data, error };
}

export async function saveFinancialDetails(details: FinancialDetails) {
    const { data, error } = await supabase
        .from("seller_financials")
        .upsert({ ...details });
    return { data, error };
}

export async function getBalance(userId: string): Promise<{ data?: { total: number; available: number; pending: number }; error?: any }> {
    // 1. Get total sales (completed)
    const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("total_amount, created_at, status")
        .eq("seller_id", userId)
        .eq("status", "completed");

    if (ordersError) return { error: ordersError };

    // 2. Get total withdrawals (pending or paid) to subtract
    const { data: withdrawals, error: withdrawalsError } = await supabase
        .from("withdrawals")
        .select("amount, status")
        .eq("user_id", userId)
        .neq("status", "rejected"); // Only subtract approved or pending withdrawals

    if (withdrawalsError) return { error: withdrawalsError };


    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));

    let totalBalance = 0;
    let availableBalance = 0;
    let pendingReleaseBalance = 0;

    orders?.forEach(order => {
        const amount = Number(order.total_amount);
        totalBalance += amount;

        const orderDate = new Date(order.created_at);
        if (orderDate <= twoDaysAgo) {
            availableBalance += amount;
        } else {
            pendingReleaseBalance += amount;
        }
    });

    const totalWithdrawn = withdrawals?.reduce((acc, w) => acc + Number(w.amount), 0) || 0;

    // Available is strictly what is released (> 2 days) minus what has been taken out
    // Total Balance as displayed to user usually means "Current Net Worth in Platform" (Available + PendingRelease - Withdrawn)

    const currentTotal = totalBalance - totalWithdrawn;
    const currentAvailable = Math.max(0, availableBalance - totalWithdrawn); // Ensure not negative
    const currentPending = pendingReleaseBalance; // Money still locked

    return {
        data: {
            total: currentTotal,
            available: currentAvailable,
            pending: currentPending
        }
    };
}

export async function requestWithdrawal(amount: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: "User not authenticated" } };

    // Validations: check balance again on server side ideally, but for now client-side logic + safe insert
    // Ideally we'd use a transaction or RPC here to ensure atomicity

    // Check if user has financial details
    const { data: finDetails } = await getFinancialDetails(user.id);
    if (!finDetails) return { error: { message: "Dados financeiros não cadastrados." } };

    const { data, error } = await supabase
        .from("withdrawals")
        .insert({
            user_id: user.id,
            amount,
            pix_key: finDetails.pix_key,
            cpf: finDetails.cpf,
            full_name: finDetails.full_name,
            status: "pending"
        })
        .select()
        .single();

    return { data, error };
}

export async function getMyWithdrawals() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No user" };

    return await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
}

// Admin functions
export async function getPendingWithdrawals() {
    return await supabase
        .from("withdrawals")
        .select(`
            *,
            user:profiles!withdrawals_user_id_fkey(name, email)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: true });
}

export async function getAllWithdrawals() {
    return await supabase
        .from("withdrawals")
        .select(`
            *,
            user:profiles!withdrawals_user_id_fkey(name, email)
        `)
        .order("created_at", { ascending: false });
}


export async function approveWithdrawal(id: string) {
    return await supabase
        .from("withdrawals")
        .update({
            status: "paid",
            paid_at: new Date().toISOString()
        })
        .eq("id", id);
}

export async function rejectWithdrawal(id: string, reason: string) {
    return await supabase
        .from("withdrawals")
        .update({
            status: "rejected",
            admin_note: reason
        })
        .eq("id", id);
}

export async function getSubscriptionStatus(userId: string) {
    const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

    return { data, error };
}
