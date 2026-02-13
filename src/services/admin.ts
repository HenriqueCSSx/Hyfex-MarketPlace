import { supabase } from "@/lib/supabase";

// ============================================
// ADMIN SERVICE - Dashboard & Management
// ============================================

// Get dashboard metrics
export async function getDashboardMetrics() {
    const [
        usersResult,
        productsResult,
        ordersResult,
        revenueResult,
        activitiesResult,
        pendingProductsResult,
    ] = await Promise.all([
        supabase.from("profiles").select("id, roles, created_at", { count: "exact" }),
        supabase.from("products").select("id", { count: "exact" }).eq("status", "approved"),
        supabase.from("orders").select("id, total_amount", { count: "exact" }).eq("status", "completed"),
        supabase.from("subscriptions").select("amount").eq("status", "active"),
        supabase.from("suspicious_activities").select("*").order("created_at", { ascending: false }).limit(10),
        supabase.from("products").select("id", { count: "exact" }).eq("status", "pending"),
    ]);

    const users = usersResult.data || [];
    const totalClients = users.filter((u) => u.roles?.includes("cliente")).length;
    const totalSellers = users.filter((u) => u.roles?.includes("vendedor")).length;
    const totalSuppliers = users.filter((u) => u.roles?.includes("fornecedor")).length;

    const totalSalesAmount = (ordersResult.data || []).reduce(
        (acc, o) => acc + parseFloat(o.total_amount || "0"), 0
    );
    const monthlyRevenue = (revenueResult.data || []).reduce(
        (acc, s) => acc + parseFloat(s.amount || "0"), 0
    );

    return {
        totalUsers: usersResult.count || 0,
        totalClients,
        totalSellers,
        totalSuppliers,
        totalActiveAds: productsResult.count || 0,
        totalPendingAds: pendingProductsResult.count || 0,
        totalSales: ordersResult.count || 0,
        totalSalesAmount,
        monthlyRevenue,
        suspiciousActivities: activitiesResult.data || [],
    };
}

// ============================================
// ADMIN USERS
// ============================================
export async function getAdminUsers(filters?: {
    search?: string;
    role?: string;
    status?: string;
}) {
    let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

    if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }
    if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
    }

    const { data, error } = await query;

    let filtered = data;
    if (filters?.role && filters.role !== "all" && data) {
        filtered = data.filter((u) => u.roles?.includes(filters.role));
    }

    return { data: filtered, error };
}

export async function updateUserStatus(userId: string, status: "active" | "suspended" | "banned") {
    const { data, error } = await supabase
        .from("profiles")
        .update({ status })
        .eq("id", userId)
        .select()
        .single();

    if (!error) {
        // When suspending/banning: hide all active products
        if (status === "suspended" || status === "banned") {
            await supabase
                .from("products")
                .update({ status: "suspended" })
                .eq("seller_id", userId)
                .eq("status", "approved");
        }

        // When activating: restore suspended products back to approved
        if (status === "active") {
            await supabase
                .from("products")
                .update({ status: "approved" })
                .eq("seller_id", userId)
                .eq("status", "suspended");
        }
    }

    return { data, error };
}

export async function updateUserRoles(userId: string, roles: string[]) {
    const { data, error } = await supabase
        .from("profiles")
        .update({ roles })
        .eq("id", userId)
        .select()
        .single();

    return { data, error };
}

// ============================================
// ADMIN PRODUCTS
// ============================================
export async function getAdminProducts(filters?: {
    search?: string;
    type?: string;
    status?: string;
}) {
    let query = supabase
        .from("products")
        .select(`
      *,
      category:categories(id, name),
      seller:profiles!products_seller_id_fkey(id, name),
      reports:product_reports(id)
    `)
        .order("created_at", { ascending: false });

    if (filters?.search) {
        query = query.ilike("title", `%${filters.search}%`);
    }
    if (filters?.type && filters.type !== "all") {
        query = query.eq("type", filters.type);
    }
    if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
    }

    const { data, error } = await query;
    return { data, error };
}

export async function updateProductStatus(
    productId: string,
    status: "pending" | "approved" | "rejected" | "removed"
) {
    const { data, error } = await supabase
        .from("products")
        .update({ status })
        .eq("id", productId)
        .select()
        .single();

    return { data, error };
}

export async function toggleProductFeatured(productId: string, featured: boolean) {
    const { data, error } = await supabase
        .from("products")
        .update({ featured })
        .eq("id", productId)
        .select()
        .single();

    return { data, error };
}

// ============================================
// ADMIN DISPUTES
// ============================================
export async function getAdminDisputes() {
    const { data, error } = await supabase
        .from("disputes")
        .select(`
      *,
      product:products(id, title),
      buyer:profiles!disputes_buyer_id_fkey(id, name),
      seller:profiles!disputes_seller_id_fkey(id, name),
      messages:dispute_messages(
        *,
        sender:profiles!dispute_messages_sender_id_fkey(id, name)
      )
    `)
        .order("created_at", { ascending: false });

    return { data, error };
}

export async function resolveDispute(
    disputeId: string,
    resolution: "resolved_refund" | "resolved_release",
    adminNotes: string
) {
    const { data, error } = await supabase
        .from("disputes")
        .update({
            status: resolution,
            admin_notes: adminNotes,
            resolved_at: new Date().toISOString(),
        })
        .eq("id", disputeId)
        .select()
        .single();

    // If refund, update order status
    if (resolution === "resolved_refund" && data) {
        await supabase
            .from("orders")
            .update({ status: "refunded" })
            .eq("id", data.order_id);
    }

    return { data, error };
}

export async function sendAdminDisputeMessage(disputeId: string, message: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from("dispute_messages")
        .insert({
            dispute_id: disputeId,
            sender_id: user.id,
            sender_type: "admin",
            message,
        })
        .select()
        .single();

    return { data, error };
}

// ============================================
// ADMIN SUBSCRIPTIONS
// ============================================
export async function getAdminSubscriptions() {
    const { data, error } = await supabase
        .from("subscriptions")
        .select(`
      *,
      user:profiles!subscriptions_user_id_fkey(id, name, email)
    `)
        .order("created_at", { ascending: false });

    return { data, error };
}

export async function updateSubscriptionStatus(
    subscriptionId: string,
    status: "active" | "inactive" | "free"
) {
    const { data, error } = await supabase
        .from("subscriptions")
        .update({ status })
        .eq("id", subscriptionId)
        .select()
        .single();

    return { data, error };
}

// ============================================
// ADMIN VERIFICATIONS
// ============================================
export async function getAdminVerifications() {
    const { data, error } = await supabase
        .from("verification_requests")
        .select(`
      *,
      user:profiles!verification_requests_user_id_fkey(id, name, email)
    `)
        .order("created_at", { ascending: false });

    return { data, error };
}

export async function resolveVerification(
    requestId: string,
    status: "approved" | "rejected",
    adminNotes: string
) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from("verification_requests")
        .update({
            status,
            admin_notes: adminNotes,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select()
        .single();

    return { data, error };
}

// ============================================
// ADMIN SETTINGS
// ============================================
export async function getPlatformSettings() {
    const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .eq("id", 1)
        .single();

    return { data, error };
}

export async function updatePlatformSettings(settings: {
    subscription_price?: number;
    platform_fee?: number;
    min_withdrawal?: number;
    max_products_per_seller?: number;
    require_ad_approval?: boolean;
    maintenance_mode?: boolean;
}) {
    const { data, error } = await supabase
        .from("platform_settings")
        .update(settings)
        .eq("id", 1)
        .select()
        .single();

    return { data, error };
}

export async function getAlgorithmSettings() {
    const { data, error } = await supabase
        .from("algorithm_settings")
        .select("*")
        .eq("id", 1)
        .single();

    return { data, error };
}

export async function updateAlgorithmSettings(settings: {
    new_seller_boost?: boolean;
    new_seller_boost_days?: number;
    new_seller_boost_multiplier?: number;
    reputation_weight?: number;
    randomness_weight?: number;
    anti_monopoly_threshold?: number;
    anti_monopoly_penalty?: number;
}) {
    const { data, error } = await supabase
        .from("algorithm_settings")
        .update(settings)
        .eq("id", 1)
        .select()
        .single();

    return { data, error };
}

// ============================================
// ADMIN REPORTS
// ============================================
export async function getProductReports() {
    const { data, error } = await supabase
        .from("product_reports")
        .select(`
      *,
      product:products(id, title, image_url),
      reporter:profiles!product_reports_reported_by_fkey(id, name)
    `)
        .order("created_at", { ascending: false });

    return { data, error };
}

export async function resolveReport(
    reportId: string,
    status: "reviewed" | "action_taken" | "dismissed",
    actionTaken?: string
) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from("product_reports")
        .update({
            status,
            action_taken: actionTaken,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
        })
        .eq("id", reportId)
        .select()
        .single();

    return { data, error };
}

// ============================================
// ADMIN CATEGORIES
// ============================================

export async function createCategory(category: { name: string; slug: string; icon?: string; image_url?: string }) {
    const { data, error } = await supabase
        .from("categories")
        .insert(category)
        .select()
        .single();

    return { data, error };
}

export async function updateCategory(id: string, updates: Partial<{ name: string; slug: string; icon: string; image_url: string }>) {
    const { data, error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    return { data, error };
}

export async function deleteCategory(id: string) {
    const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

    return { error };
}
