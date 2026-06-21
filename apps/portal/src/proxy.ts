import type { NextRequest } from "next/server";
import { updateSession } from "@repo/database/middleware";

// Next.js 16 renamed Middleware to Proxy. Refreshes the Supabase session and
// gates protected routes (logic shared from @repo/database).
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Exclude the PWA service worker and manifest so they're publicly fetchable
    // (otherwise an unauthenticated request gets redirected to /login).
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)",
  ],
};
