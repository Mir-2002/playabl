import { afterEach, describe, expect, it, vi } from "vitest";
import {
  mintSpotifyToken,
  SpotifyRateLimitError,
  SpotifyReauthError,
} from "../../supabase/functions/_shared/token";

const input = {
  refreshToken: "refresh-abc",
  clientId: "client-123",
  clientSecret: "secret-456",
};

function mockFetch(response: Response) {
  const fn = vi.fn((_url: string, _init?: RequestInit) =>
    Promise.resolve(response),
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("mintSpotifyToken", () => {
  it("exchanges a refresh token for an access token", async () => {
    const fetchFn = mockFetch(
      jsonResponse({ access_token: "access-xyz", expires_in: 3600 }),
    );

    const before = Date.now();
    const result = await mintSpotifyToken(input);
    const after = Date.now();

    expect(result.accessToken).toBe("access-xyz");
    // expires_at is ISO and ~3600s in the future.
    const expiresMs = new Date(result.expiresAt).getTime();
    expect(expiresMs).toBeGreaterThanOrEqual(before + 3600 * 1000);
    expect(expiresMs).toBeLessThanOrEqual(after + 3600 * 1000);
    expect(result.rotatedRefreshToken).toBeUndefined();

    // Correct endpoint, Basic auth, and grant type.
    const call = fetchFn.mock.calls[0]!;
    const url = call[0];
    const init = call[1]!;
    expect(url).toBe("https://accounts.spotify.com/api/token");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(
      `Basic ${btoa("client-123:secret-456")}`,
    );
    expect(headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    const body = init.body as URLSearchParams;
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe("refresh-abc");
  });

  it("surfaces a rotated refresh token when Spotify returns one", async () => {
    mockFetch(
      jsonResponse({
        access_token: "access-xyz",
        expires_in: 3600,
        refresh_token: "rotated-new",
      }),
    );

    const result = await mintSpotifyToken(input);
    expect(result.rotatedRefreshToken).toBe("rotated-new");
  });

  it("throws SpotifyReauthError on invalid_grant (revoked consent)", async () => {
    mockFetch(
      jsonResponse({ error: "invalid_grant" }, { status: 400 }),
    );

    await expect(mintSpotifyToken(input)).rejects.toBeInstanceOf(
      SpotifyReauthError,
    );
  });

  it("throws SpotifyRateLimitError on 429", async () => {
    mockFetch(
      new Response("", { status: 429, headers: { "Retry-After": "5" } }),
    );

    await expect(mintSpotifyToken(input)).rejects.toBeInstanceOf(
      SpotifyRateLimitError,
    );
  });

  it("throws a generic error on other failures", async () => {
    mockFetch(jsonResponse({ error: "server_error" }, { status: 500 }));

    await expect(mintSpotifyToken(input)).rejects.toThrow();
  });
});
