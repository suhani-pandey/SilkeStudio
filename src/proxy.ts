import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { buildContentSecurityPolicy, createNonce } from "@/lib/csp";

export async function proxy(request: NextRequest) {
  const nonce = createNonce();
  const csp = buildContentSecurityPolicy({
    nonce,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    isDev: process.env.NODE_ENV === "development",
    isHttps:
      request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https",
  });

  // Next.js reads the nonce from the request's CSP header while rendering and stamps it onto its
  // own scripts; the response header is what the browser enforces.
  const response = await updateSession(request, {
    "x-nonce": nonce,
    "Content-Security-Policy": csp,
  });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Static files don't need a session refresh or a page nonce. sw.js in particular is left out
    // so the service worker's own script is served exactly as it is on disk.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
