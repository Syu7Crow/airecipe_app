import './env.js'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey,
)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

export function checkSupabaseConnection() {
  if (!supabase || !supabaseUrl || !supabasePublishableKey) {
    return {
      ok: false,
      configured: false,
      message: 'Supabase is not configured',
    }
  }

  try {
    new URL(supabaseUrl)
  } catch {
    return {
      ok: false,
      configured: true,
      message: 'Supabase URL is invalid',
    }
  }

  return {
    ok: true,
    configured: true,
    message: 'Supabase is configured on the server',
  }
}
