import { createClient } from '@supabase/supabase-js'

// Guard against missing env vars (sandbox / local dev without .env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// createClient will still work with empty strings — queries will simply fail
// gracefully and the app will fall back to local vocabulary data.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)
