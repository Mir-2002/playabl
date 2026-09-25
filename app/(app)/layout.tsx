import { getUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppHeader } from "@/components/app-header"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const {
    data: { user },
  } = await getUser()

  if (!user) redirect("/login")

  return (
    <div className="min-h-screen bg-background bg-dots">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
