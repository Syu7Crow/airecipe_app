import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabasePublishableKey = import.meta.env
  .VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey,
)

export const supabase =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey)
  : null

export async function checkSupabaseConnection() {
  if (!supabase || !supabaseUrl || !supabasePublishableKey) {
    return {
      ok: false,
      message: 'Supabase未設定',
    }
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: supabasePublishableKey,
        Authorization: `Bearer ${supabasePublishableKey}`,
      },
    })

    if (!response.ok) {
      return {
        ok: false,
        message: 'Supabase接続エラー',
      }
    }
  } catch {
    return {
      ok: false,
      message: 'Supabase接続エラー',
    }
  }

  return {
    ok: true,
    message: 'Supabase接続済み',
  }
}
