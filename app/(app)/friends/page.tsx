import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getFriendsData } from "./actions"
import { FriendsClient } from "./_components/friends-client"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Friends — Playabl" }

export default async function FriendsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const initialData = await getFriendsData(user.id)

  return (
    <div className="space-y-2">
      <h1 className="font-heading font-extrabold text-3xl text-foreground">Friends</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Share your profile link{" "}
        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded border border-foreground/10">
          {process.env.NEXT_PUBLIC_SITE_URL}/u/{user.id}
        </span>{" "}
        to invite friends.
      </p>
      <FriendsClient viewerId={user.id} initialData={initialData} />
    </div>
  )
}
