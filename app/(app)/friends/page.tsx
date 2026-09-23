import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getFriendsData } from "./actions"
import { FriendsClient } from "./_components/friends-client"
import { CopyLinkButton } from "@/components/copy-link-button"
import { PageHeader } from "@/components/ui/page-header"
import { Users } from "lucide-react"
import { env } from "@/lib/env"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Friends — Playabl" }

export default async function FriendsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const [initialData, { data: profile }] = await Promise.all([
    getFriendsData(user.id),
    supabase.from("profiles").select("username").eq("id", user.id).single(),
  ])

  // Invite links are the public username slug — a /u/<uuid> path 404s since the
  // slug migration removed the UUID fallback.
  const inviteUrl = `${env.NEXT_PUBLIC_SITE_URL}/u/${profile?.username ?? ""}`

  return (
    <div className="space-y-6">
      <PageHeader
        title="Friends"
        subtitle="Share your profile link to invite friends."
        icon={<Users className="w-5 h-5 text-white" />}
        iconBg="bg-[#F472B6]"
        action={<CopyLinkButton url={inviteUrl} />}
      />
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-xs bg-muted px-2 py-1.5 rounded border border-foreground/10 truncate max-w-full">
          {inviteUrl}
        </span>
      </div>
      <FriendsClient viewerId={user.id} initialData={initialData} />
    </div>
  )
}
