export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image_url?: string;
}

export interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    image_url: string;
    category_id: string;
    category?: Category;
    seller_id: string;
    seller?: {
        id: string;
        name: string;
        reputation: number;
        avatar_url?: string;
    };
    type: "venda_final" | "fornecedor";
    stock: number;
    min_quantity: number;
    views: number;
    sales: number;
    created_at: string;
    status: "pending" | "approved" | "rejected" | "removed";
    featured: boolean;
}

export interface Review {
    id: string;
    product_id: string;
    reviewer_id: string;
    reviewer?: {
        id: string;
        name: string;
        avatar_url?: string;
    };
    rating: number;
    comment: string;
    created_at: string;
}
