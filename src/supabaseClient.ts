import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Safely get env vars - they might not exist in sandboxed environments
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Base client (anon). Useful for public reads.
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Helper to check if Supabase is available
export const isSupabaseConfigured = (): boolean => {
  return supabaseUrl.length > 0 && supabaseAnonKey.length > 0;
};

/**
 * Returns a Supabase client that sends the provided JWT as Authorization.
 *
 * This is required for RLS-protected tables that use auth.uid() policies.
 * (Your app does auth via /api routes and stores the JWT in localStorage,
 * so the default anon client is not automatically authenticated.)
 */
export function getSupabaseAuthedClient(accessToken: string | null | undefined): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!accessToken) return null;

  // Create a lightweight client instance with the user's JWT in global headers.
  // This avoids needing refresh tokens / supabase-js auth flows in the browser.
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
