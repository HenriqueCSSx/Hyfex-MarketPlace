import { supabase } from "@/lib/supabase";

export interface Question {
    id: string;
    product_id: string;
    product?: {
        title: string;
        image_url: string;
        seller_id?: string;
    };
    user_id: string;
    user?: {
        name: string;
    };
    question: string;
    answer?: string;
    answered_at?: string;
    created_at: string;
}

// Create a new question
export async function createQuestion(productId: string, question: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from("product_questions")
        .insert({
            product_id: productId,
            user_id: user.id,
            question
        })
        .select()
        .single();

    return { data, error };
}

// Get all questions for a specific product public view
export async function getProductQuestions(productId: string) {
    const { data, error } = await supabase
        .from("product_questions")
        .select(`
            *,
            user:profiles(name)
        `)
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

    return { data, error };
}

// Get questions asked *by* the current user (Minhas Perguntas)
export async function getMyQuestions() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: "Not authenticated" } };

    const { data, error } = await supabase
        .from("product_questions")
        .select(`
            *,
            product:products(
                title,
                image_url,
                seller_id
            )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    return { data, error };
}

// Get questions asked on my products (Dashboard Vendedor)
export async function getSellerIncomingQuestions() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: "Not authenticated" } };

    // This is tricky with plain RLS/joins in a single simple query if we don't have a direct link.
    // However, we can select questions where product.seller_id = me.
    // Supabase allows filtering on joined tables!

    const { data, error } = await supabase
        .from("product_questions")
        .select(`
            *,
            product:products!inner(
                id,
                title,
                image_url,
                seller_id
            ),
            user:profiles(name)
        `)
        .eq("product.seller_id", user.id)
        .order("created_at", { ascending: false });

    return { data, error };
}

// Answer a question
export async function answerQuestion(questionId: string, answer: string) {
    const { error } = await supabase
        .from("product_questions")
        .update({
            answer,
            answered_at: new Date().toISOString()
        })
        .eq("id", questionId);

    return { error };
}

// Delete a question (only if unanswered and owner)
export async function deleteQuestion(questionId: string) {
    const { error } = await supabase
        .from("product_questions")
        .delete()
        .eq("id", questionId)
        .is("answer", null); // Extra safety check

    return { error };
}
