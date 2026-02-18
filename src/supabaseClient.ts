import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Safely get env vars - they might not exist in sandboxed environments
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Only create the client if both env vars are present
export const supabase: SupabaseClient | null = 
  supabaseUrl && supabaseAnonKey 
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Helper to check if Supabase is available
export const isSupabaseConfigured = (): boolean => {
  return supabase !== null;
};
