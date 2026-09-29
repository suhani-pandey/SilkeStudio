import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy, createNonce } from "@/lib/csp";

const base = {
  nonce: "abc123",
  supabaseUrl: "https://project.supabase.co",
  isDev: false,
  isHttps: true,
};

function directive(policy: string, name: string): string {
  return policy.split("; ").find((d) => d.startsWith(`${name} `)) ?? "";
}

describe("buildContentSecurityPolicy", () => {
  const policy = buildContentSecurityPolicy(base);

  it("only runs scripts carrying this request's nonce", () => {
    expect(directive(policy, "script-src")).toBe(
      "script-src 'self' 'nonce-abc123' 'strict-dynamic'",
    );
  });

  it("never allows eval in production", () => {
    expect(policy).not.toContain("unsafe-eval");
    expect(buildContentSecurityPolicy({ ...base, isDev: true })).toContain("'unsafe-eval'");
  });

  it("lets the browser reach Supabase over HTTPS and WebSocket, and nothing else external", () => {
    expect(directive(policy, "connect-src")).toBe(
      "connect-src 'self' https://project.supabase.co wss://project.supabase.co https://challenges.cloudflare.com",
    );
  });

  it("refuses to be framed and allows no plugins", () => {
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
  });

  it("lets the service worker register despite strict-dynamic", () => {
    expect(policy).toContain("worker-src 'self'");
  });

  it("upgrades insecure requests only when served over HTTPS", () => {
    expect(policy).toContain("upgrade-insecure-requests");
    expect(buildContentSecurityPolicy({ ...base, isHttps: false })).not.toContain(
      "upgrade-insecure-requests",
    );
  });

  it("stays valid when no Supabase URL is configured", () => {
    const bare = buildContentSecurityPolicy({ ...base, supabaseUrl: undefined });
    expect(directive(bare, "img-src")).toBe("img-src 'self' data: blob:");
  });
});

describe("createNonce", () => {
  it("is different on every call", () => {
    const nonces = new Set(Array.from({ length: 50 }, createNonce));
    expect(nonces.size).toBe(50);
  });
});
