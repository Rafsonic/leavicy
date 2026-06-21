import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { APP_UNLOCKED_COOKIE, HAS_PASSKEY_COOKIE } from "./webauthn.shared";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/invite",
  "/auth",
  "/privacy",
  "/cookies",
  "/offline",
];

// Reachable while authenticated-but-locked, so the unlock flow can run without
// the gate redirecting onto itself.
const UNLOCK_PATHS = ["/unlock", "/auth/webauthn"];

function matches(pathname: string, paths: string[]) {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isPublic(pathname: string) {
  return matches(pathname, PUBLIC_PATHS);
}

/**
 * Refreshes the Supabase auth session on every request and gates protected
 * routes. Called from `src/proxy.ts` (Next.js 16's renamed middleware).
 */
export async function updateSession(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: don't run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  // "App Unlock" gate: an authenticated user who has enrolled a passkey must
  // pass Face ID before reaching protected pages. The Supabase session is left
  // intact — this only locks the UI. Skip on public + unlock routes so the
  // gate never redirects onto itself.
  if (
    user &&
    request.cookies.get(HAS_PASSKEY_COOKIE)?.value === "1" &&
    request.cookies.get(APP_UNLOCKED_COOKIE)?.value !== "1" &&
    !isPublic(pathname) &&
    !matches(pathname, UNLOCK_PATHS)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/unlock";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
