import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

// Cookieless anon client for reading public (public-read RLS) data.
//
// Unlike the server-component client, this never calls `cookies()`, so it is
// safe to use inside `unstable_cache`/`"use cache"` scopes — accessing
// request-scoped dynamic data (cookies/headers) there throws at runtime.
// Anon key = still RLS-gated, so it can only see the same public columns an
// anonymous visitor could.
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )
}
