import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchWithRetry, isRetryableStatus } from "@/lib/fetch-retry";

const fast = { backoffMs: [0], timeoutMs: 1000, budgetMs: 5000 };

function mockFetch(...outcomes: (number | Error)[]) {
  const fn = vi.fn();
  for (const outcome of outcomes) {
    if (outcome instanceof Error) fn.mockRejectedValueOnce(outcome);
    else fn.mockResolvedValueOnce(new Response(null, { status: outcome }));
  }
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("isRetryableStatus", () => {
  it("retries provider trouble and rate limiting, not permanent rejections", () => {
    expect(isRetryableStatus(500)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(400)).toBe(false);
    expect(isRetryableStatus(401)).toBe(false);
    expect(isRetryableStatus(200)).toBe(false);
  });
});

describe("fetchWithRetry", () => {
  it("succeeds after a momentary provider error", async () => {
    const fetch = mockFetch(503, 200);
    const response = await fetchWithRetry("https://x.test", {}, fast);
    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("recovers from a dropped connection", async () => {
    const fetch = mockFetch(new TypeError("fetch failed"), 200);
    await expect(fetchWithRetry("https://x.test", {}, fast)).resolves.toHaveProperty("status", 200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("does not retry a permanent rejection", async () => {
    const fetch = mockFetch(400, 200);
    const response = await fetchWithRetry("https://x.test", {}, fast);
    expect(response.status).toBe(400);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("stops after the allowed attempts and returns the last response", async () => {
    const fetch = mockFetch(500, 500, 500, 200);
    const response = await fetchWithRetry("https://x.test", {}, { ...fast, attempts: 3 });
    expect(response.status).toBe(500);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("throws when every attempt fails at the network level", async () => {
    mockFetch(new TypeError("a"), new TypeError("b"), new TypeError("c"));
    await expect(fetchWithRetry("https://x.test", {}, fast)).rejects.toThrow("c");
  });

  it("respects the time budget even with attempts left", async () => {
    const fetch = mockFetch(503, 503, 503);
    await fetchWithRetry("https://x.test", {}, { attempts: 3, backoffMs: [60], budgetMs: 50 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
