import { describe, expect, it } from "vitest";
import { z } from "zod";

// Mirror of supabase/functions/_shared/types.ts using Node-compatible zod import.
// The shared file uses `npm:zod@4` (Deno-only); these schemas are kept in sync
// manually so tests can run under Vitest without Deno tooling.

const SpotifyTrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  duration_ms: z.number(),
  artists: z.array(z.object({ name: z.string() })).min(1),
});

const SpotifyPlayHistoryItemSchema = z.object({
  track: SpotifyTrackSchema,
  played_at: z.string().datetime(),
});

const RecentlyPlayedSchema = z.object({
  items: z.array(SpotifyPlayHistoryItemSchema),
  cursors: z
    .object({
      before: z.string().optional(),
      after: z.string().optional(),
    })
    .optional(),
  next: z.string().nullable().optional(),
});

const validTrack = {
  id: "5GjwIZCVtSy8D7vVbBGnbZ",
  name: "Blinding Lights",
  duration_ms: 200040,
  artists: [{ name: "The Weeknd" }],
};

const validItem = {
  track: validTrack,
  played_at: "2026-09-06T10:00:00.000Z",
};

const validResponse = {
  items: [validItem],
  cursors: { before: "1725616800000", after: "1725616800001" },
  next: "https://api.spotify.com/v1/me/recently-played?before=1725616800000",
};

describe("RecentlyPlayedSchema", () => {
  it("accepts a valid full response", () => {
    expect(() => RecentlyPlayedSchema.parse(validResponse)).not.toThrow();
  });

  it("accepts an empty items array (no new tracks)", () => {
    expect(() => RecentlyPlayedSchema.parse({ items: [] })).not.toThrow();
  });

  it("accepts response without optional cursors and next", () => {
    expect(() => RecentlyPlayedSchema.parse({ items: [validItem] })).not.toThrow();
  });

  it("rejects when items is missing", () => {
    expect(() => RecentlyPlayedSchema.parse({})).toThrow(z.ZodError);
  });

  it("rejects when track.artists is empty", () => {
    const bad = {
      items: [{ track: { ...validTrack, artists: [] }, played_at: validItem.played_at }],
    };
    expect(() => RecentlyPlayedSchema.parse(bad)).toThrow(z.ZodError);
  });

  it("rejects when played_at is not ISO 8601", () => {
    const bad = { items: [{ ...validItem, played_at: "not-a-date" }] };
    expect(() => RecentlyPlayedSchema.parse(bad)).toThrow(z.ZodError);
  });

  it("rejects when track.name is missing", () => {
    const bad = {
      items: [
        {
          track: { id: "abc", duration_ms: 1000, artists: [{ name: "X" }] },
          played_at: validItem.played_at,
        },
      ],
    };
    expect(() => RecentlyPlayedSchema.parse(bad)).toThrow(z.ZodError);
  });

  it("strips unknown top-level fields", () => {
    const result = RecentlyPlayedSchema.parse({
      ...validResponse,
      total: 50, // not in schema
    });
    expect((result as Record<string, unknown>).total).toBeUndefined();
  });
});
