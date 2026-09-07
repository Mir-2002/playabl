import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getFriendsData } from "./actions"
import { FriendsClient } from "./_components/friends-client"
import { CopyLinkButton } from "@/components/copy-link-button"
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
      <div className="mb-6 space-y-2">
        <p className="text-muted-foreground text-sm">
          Share your profile link to invite friends.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs bg-muted px-2 py-1.5 rounded border border-foreground/10 truncate max-w-full">
            {process.env.NEXT_PUBLIC_SITE_URL}/u/{user.id}
          </span>
          <CopyLinkButton url={`${process.env.NEXT_PUBLIC_SITE_URL}/u/${user.id}`} />
        </div>
      </div>
      <FriendsClient viewerId={user.id} initialData={initialData} />
    </div>
  )
}
