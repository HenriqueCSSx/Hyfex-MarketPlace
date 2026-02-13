import { supabase } from "@/lib/supabase";

// ============================================
// PRODUCTS SERVICE
// ============================================

export interface ProductFilters {
    category?: string;
    type?: "venda_final" | "fornecedor";
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: "price_asc" | "price_desc" | "newest" | "popular";
    limit?: number;
    offset?: number;
}

// List approved products (public marketplace)
export async function getProducts(filters: ProductFilters = {}) {
    let query = supabase
        .from("products")
        .select(`
      *,
      category:categories(id, name, slug),
      seller:profiles!products_seller_id_fkey(id, name, reputation, avatar_url)
    `)
        .eq("status", "approved");

    if (filters.category) {
        query = query.eq("category.slug", filters.category);
    }
    if (filters.type) {
        query = query.eq("type", filters.type);
    }
    if (filters.search) {
        query = query.ilike("title", `%${filters.search}%`);
    }
    if (filters.minPrice !== undefined) {
        query = query.gte("price", filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
        query = query.lte("price", filters.maxPrice);
    }

    // Sorting
    switch (filters.sortBy) {
        case "price_asc":
            query = query.order("price", { ascending: true });
            break;
        case "price_desc":
            query = query.order("price", { ascending: false });
            break;
        case "popular":
            query = query.order("sales", { ascending: false });
            break;
        case "newest":
        default:
            query = query.order("created_at", { ascending: false });
            break;
    }

    if (filters.limit) {
        query = query.limit(filters.limit);
    }
    if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data, error } = await query;
    return { data, error };
}

// Get single product by ID
export async function getProductById(id: string) {
    // Increment views (fire and forget)
    try { await supabase.rpc("increment_product_views", { product_uuid: id }); } catch { /* ignore */ }

    const { data, error } = await supabase
        .from("products")
        .select(`
      *,
      category:categories(id, name, slug),
      seller:profiles!products_seller_id_fkey(id, name, reputation, avatar_url)
    `)
        .eq("id", id)
        .single();

    return { data, error };
}

// Get featured products
export async function getFeaturedProducts(limit = 8) {
    const { data, error } = await supabase
        .from("products")
        .select(`
      *,
      category:categories(id, name, slug),
      seller:profiles!products_seller_id_fkey(id, name, reputation, avatar_url)
    `)
        .eq("status", "approved")
        .eq("featured", true)
        .order("sales", { ascending: false })
        .limit(limit);

    return { data, error };
}

// Get products by seller
export async function getSellerProducts(sellerId: string) {
    const { data, error } = await supabase
        .from("products")
        .select(`
      *,
      category:categories(id, name, slug)
    `)
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });

    return { data, error };
}

// Get seller profile details
export async function getSellerProfile(sellerId: string) {
    const { data, error } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, reputation, created_at, bio, location")
        .eq("id", sellerId)
        .single();

    return { data, error };
}

// Create product
export async function createProduct(product: {
    title: string;
    description: string;
    price: number;
    image_url?: string;
    category_id?: string;
    type: "venda_final" | "fornecedor";
    stock: number;
    min_quantity?: number;
}) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from("products")
        .insert({ ...product, seller_id: user.id })
        .select()
        .single();

    return { data, error };
}

// Update product
export async function updateProduct(id: string, updates: Partial<{
    title: string;
    description: string;
    price: number;
    image_url: string;
    category_id: string;
    stock: number;
    min_quantity: number;
}>) {
    const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    return { data, error };
}

// Delete product
export async function deleteProduct(id: string) {
    const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

    return { error };
}

// ============================================
// CATEGORIES SERVICE
// ============================================

export async function getCategories() {
    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

    return { data, error };
}

// ============================================
// REVIEWS SERVICE
// ============================================

export async function getProductReviews(productId: string) {
    const { data, error } = await supabase
        .from("reviews")
        .select(`
      *,
      reviewer:profiles!reviews_reviewer_id_fkey(id, name, avatar_url)
    `)
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

    return { data, error };
}

export async function createReview(review: {
    order_id: string;
    product_id: string;
    seller_id: string;
    rating: number;
    comment?: string;
}) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from("reviews")
        .insert({ ...review, reviewer_id: user.id })
        .select()
        .single();

    // Update seller reputation (async, no wait)
    updateSellerReputation(review.seller_id);

    return { data, error };
}

export async function getSellerReviews(sellerId: string) {
    const { data, error } = await supabase
        .from("reviews")
        .select(`
            *,
            reviewer:profiles!reviews_reviewer_id_fkey(id, name, avatar_url),
            product:products(id, title)
        `)
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });

    return { data, error };
}

async function updateSellerReputation(sellerId: string) {
    // Calculate new average
    const { data } = await supabase
        .from("reviews")
        .select("rating")
        .eq("seller_id", sellerId);

    if (data && data.length > 0) {
        const avg = data.reduce((acc, r) => acc + r.rating, 0) / data.length;
        await supabase
            .from("profiles")
            .update({ reputation: avg })
            .eq("id", sellerId);
    }
}
