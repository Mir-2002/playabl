"use client"

import { useQuery } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import { Music } from "lucide-react"
import { getNowPlaying } from "../actions"

export function NowPlaying() {
  const { data } = useQuery({
    queryKey: ["now-playing"],
    queryFn: getNowPlaying,
    refetchInterval: 30_000,
  })

  if (!data) return null

  const { isPlaying, track_name, artist, image_url, played_at } = data

  return (
    <div className="ml-auto hidden sm:flex items-center gap-3 flex-shrink-0">
      <div className="flex flex-col items-end gap-0.5 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              isPlaying
                ? "bg-[#34D399] animate-pulse"
                : "bg-muted-foreground/40"
            }`}
          />
          <span className="text-xs font-medium text-muted-foreground">
            {isPlaying ? "Now Playing" : "Last played"}
          </span>
        </div>
        <p className="font-bold text-sm text-foreground truncate max-w-[180px]">
          {track_name}
        </p>
        <p className="text-xs text-muted-foreground truncate max-w-[180px]">
          {artist}
          {!isPlaying && played_at
            ? ` · ${formatDistanceToNow(new Date(played_at), { addSuffix: true })}`
            : null}
        </p>
      </div>

      <div className="w-14 h-14 rounded-lg border-2 border-foreground overflow-hidden flex-shrink-0 flex items-center justify-center bg-muted">
        {image_url ? (
          <Image
            src={image_url}
            alt={track_name}
            width={56}
            height={56}
            className="object-cover w-full h-full"
          />
        ) : (
          <Music className="w-6 h-6 text-muted-foreground" />
        )}
      </div>
    </div>
  )
}
