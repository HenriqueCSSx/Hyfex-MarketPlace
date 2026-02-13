import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables. Check your .env file or Vercel project settings.");
}

console.log("Supabase URL present:", !!supabaseUrl);
console.log("Supabase Key present:", !!supabaseAnonKey);

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
