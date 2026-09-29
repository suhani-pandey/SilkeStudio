/**
 * The Content-Security-Policy sent with every page.
 *
 * Scripts: only those carrying this request's nonce run, plus whatever they load themselves
 * ('strict-dynamic'). Next.js adds the nonce to its own scripts automatically once it sees it in
 * the request's CSP header — which is why pages must render per request for this to work.
 *
 * Styles allow 'unsafe-inline' on purpose. The dialog, popover and toast components position
 * themselves with inline style attributes, which nonces can't cover; style injection is a far
 * smaller risk than script injection, and scripts stay strict.
 *
 * Kept pure so it can be unit tested without a request.
 */
export interface CspOptions {
  nonce: string;
  supabaseUrl?: string;
  isDev: boolean;
  isHttps: boolean;
}

export function buildContentSecurityPolicy({
  nonce,
  supabaseUrl,
  isDev,
  isHttps,
}: CspOptions): string {
  const supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : null;
  const supabaseHttp = supabaseHost ? `https://${supabaseHost}` : "";
  const supabaseWs = supabaseHost ? `wss://${supabaseHost}` : "";

  // Cloudflare's bot check on the booking form.
  const turnstile = "https://challenges.cloudflare.com";

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // React needs eval in development only, for its error overlays.
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", supabaseHttp],
    "font-src": ["'self'", "data:"],
    // Auth, database, storage uploads and realtime all talk to Supabase straight from the browser.
    "connect-src": ["'self'", supabaseHttp, supabaseWs, turnstile, ...(isDev ? ["ws:"] : [])],
    // The map loads only after the visitor asks for it; Turnstile renders in its own frame.
    "frame-src": ["https://www.google.com", "https://maps.google.com", turnstile],
    // Without this the service worker would fall back to script-src, where 'strict-dynamic'
    // makes browsers ignore 'self' and refuse to register it.
    "worker-src": ["'self'"],
    "manifest-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  const policy = Object.entries(directives)
    .map(([name, values]) => `${name} ${values.filter(Boolean).join(" ")}`)
    .join("; ");

  // Only over HTTPS: on plain-HTTP localhost it would try to upgrade every request and break.
  return isHttps ? `${policy}; upgrade-insecure-requests` : policy;
}

/** A fresh, unguessable value for each request. */
export function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}
