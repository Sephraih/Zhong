import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// In sandbox/preview environments the Vite env vars may not be set.
// Avoid crashing the app at module import time.
export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;
