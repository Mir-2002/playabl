import { z } from "npm:zod@4";

export const SpotifyTrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  duration_ms: z.number(),
  artists: z.array(z.object({ name: z.string() })).min(1),
});

export const SpotifyPlayHistoryItemSchema = z.object({
  track: SpotifyTrackSchema,
  played_at: z.string().datetime(),
});

export const RecentlyPlayedSchema = z.object({
  items: z.array(SpotifyPlayHistoryItemSchema),
  cursors: z
    .object({
      before: z.string().optional(),
      after: z.string().optional(),
    })
    .nullable()
    .optional(),
  next: z.string().nullable().optional(),
});

export type SpotifyTrack = z.infer<typeof SpotifyTrackSchema>;
export type SpotifyPlayHistoryItem = z.infer<typeof SpotifyPlayHistoryItemSchema>;
export type RecentlyPlayed = z.infer<typeof RecentlyPlayedSchema>;
