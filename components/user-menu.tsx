"use client"

import { Menu } from "@base-ui/react/menu"
import Link from "next/link"
import { ChevronDown, LogOut, Trash2, User, Users } from "lucide-react"
import { signOut, deleteAccount } from "@/app/auth/actions"

interface Props {
  userId: string
  displayName: string
  avatarUrl: string | null
  pendingCount: number
}

export function UserMenu({ userId, displayName, avatarUrl, pendingCount }: Props) {
  return (
    <Menu.Root>
      <Menu.Trigger className="flex items-center gap-2 rounded-full pl-1 pr-2.5 py-1 hover:bg-[#FBBF24] transition-colors duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/30">
        <span className="relative flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full border-2 border-foreground"
              style={{ boxShadow: "2px 2px 0px 0px #1E293B" }}
            />
          ) : (
            <span
              className="w-8 h-8 rounded-full border-2 border-foreground bg-primary flex items-center justify-center text-white text-xs font-bold"
              style={{ boxShadow: "2px 2px 0px 0px #1E293B" }}
            >
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
          {pendingCount > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center border-2 border-white"
              aria-label={`${pendingCount} pending friend request${pendingCount === 1 ? "" : "s"}`}
            >
              {pendingCount}
            </span>
          )}
        </span>
        <span className="text-sm font-medium text-foreground">{displayName}</span>
        <ChevronDown className="w-4 h-4 text-foreground/70" aria-hidden />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={10} className="z-50">
          <Menu.Popup className="min-w-52 bg-white border-2 border-foreground rounded-xl shadow-hard p-1.5 outline-none">
            <Menu.LinkItem
              render={<Link href={`/u/${userId}`} />}
              closeOnClick
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-foreground cursor-pointer select-none data-[highlighted]:bg-[#FBBF24] outline-none"
            >
              <User className="w-4 h-4" aria-hidden />
              Profile
            </Menu.LinkItem>

            <Menu.LinkItem
              render={<Link href="/friends" />}
              closeOnClick
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-foreground cursor-pointer select-none data-[highlighted]:bg-[#FBBF24] outline-none"
            >
              <Users className="w-4 h-4" aria-hidden />
              Friends
              {pendingCount > 0 && (
                <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </Menu.LinkItem>

            <Menu.Separator className="my-1.5 h-px bg-foreground/10" />

            <form action={signOut}>
              <Menu.Item
                nativeButton
                render={<button type="submit" />}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-destructive cursor-pointer select-none data-[highlighted]:bg-destructive/10 outline-none"
              >
                <LogOut className="w-4 h-4" aria-hidden />
                Sign out
              </Menu.Item>
            </form>

            <form
              action={deleteAccount}
              onSubmit={(e) => {
                if (
                  !confirm(
                    "Delete your account? This permanently removes all your data and cannot be undone.",
                  )
                ) {
                  e.preventDefault()
                }
              }}
            >
              <Menu.Item
                nativeButton
                render={<button type="submit" />}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-destructive/70 cursor-pointer select-none data-[highlighted]:bg-destructive/10 outline-none"
              >
                <Trash2 className="w-4 h-4" aria-hidden />
                Delete account
              </Menu.Item>
            </form>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
