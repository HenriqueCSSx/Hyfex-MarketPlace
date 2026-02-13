import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables. Check your .env file or Vercel project settings.");
}

// Use placeholders to prevent crash during module initialization
// This allows the app to start and show a proper error message in the UI
const safeUrl = supabaseUrl || "https://placeholder.supabase.co";
const safeKey = supabaseAnonKey || "placeholder";

export const supabase = createClient(safeUrl, safeKey);
