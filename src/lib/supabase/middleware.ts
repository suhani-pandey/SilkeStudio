import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { getCachedJwks } from "@/lib/supabase/jwks";

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Verifies the token's signature against the project's public key, held locally after the first
  // fetch — unlike getUser(), which called the Supabase Auth API on every navigation and put
  // 150–300 ms of dead time in front of every page, static ones included. It still refreshes an
  // expired session, so server components downstream see a valid one.
  const jwks = await getCachedJwks();
  const { data } = await supabase.auth.getClaims(undefined, jwks ? { jwks } : undefined);
  const signedIn = Boolean(data?.claims?.sub);

  // Middleware only decides "is anyone signed in". Whether that person is the owner is settled in
  // the admin layout, which has to load their profile anyway — and row-level security is the real
  // boundary regardless, so nothing rests on this check alone.
  if (isAdminRoute && pathname !== "/admin/login" && !signedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
