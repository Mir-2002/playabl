import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { cache } from "react"
import type { Database } from "@/lib/database.types"

// cache() deduplicates this across all RSC + Route Handler calls within one render tree,
// so layout/header/page all share the same client without extra round-trips.
export const createClient = cache(async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — cookie writes are
            // handled by middleware; safe to ignore here.
          }
        },
      },
    }
  )
})

// getUser() makes a GoTrue network call on every invocation even when the
// Supabase client is cached. Wrapping it in cache() collapses the
// layout + header + page calls within one RSC render to a single round-trip.
export const getUser = cache(async () => {
  const supabase = await createClient()
  return supabase.auth.getUser()
})
