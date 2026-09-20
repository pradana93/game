import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    // Never crash routing: without env, just pass through and let
    // pages/layouts handle auth (they redirect to /login).
    if (!url || !anon) return NextResponse.next();
    const res = NextResponse.next();
    const supa = createServerClient(url, anon, {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    });
    await supa.auth.getUser();
    return res;
  } catch {
    return NextResponse.next();
  }
}

// NOTE: /api/* intentionally excluded — API routes auth-check themselves.
// Running session-refresh in middleware for APIs only adds a crash surface.
export const config = { matcher: ["/play/:path*", "/rooms/:path*"] };
