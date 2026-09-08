"use client"

import { useQuery } from "@tanstack/react-query"
import Image from "next/image"
import { Music } from "lucide-react"
import { getNowPlaying } from "@/app/(app)/home/actions"

export function NowPlaying() {
  const { data } = useQuery({
    queryKey: ["now-playing"],
    queryFn: getNowPlaying,
    // Poll while the tab is focused. TanStack pauses this when the tab is
    // hidden (refetchIntervalInBackground defaults to false).
    refetchInterval: 15_000,
  })

  const playing = data?.isPlaying ?? false

  return (
    <div className="ml-auto hidden sm:flex flex-col items-end gap-2">
      {playing && (
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse"
            aria-hidden
          />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Now Playing
          </span>
        </div>
      )}
      <div className="flex items-center gap-3">
        {playing && (
          <div className="text-right max-w-[160px]">
            <p className="text-sm font-bold text-foreground truncate">
              {data?.trackName}
            </p>
            {data?.artists && (
              <p className="text-xs text-muted-foreground truncate">
                {data.artists}
              </p>
            )}
          </div>
        )}
        <div className="w-14 h-14 rounded-lg border-2 border-foreground overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
          {playing && data?.albumArt ? (
            <Image
              src={data.albumArt}
              alt={data.trackName ?? "Album art"}
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          ) : (
            <Music className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  )
}
