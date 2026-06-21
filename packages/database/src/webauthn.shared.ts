/**
 * Lightweight WebAuthn shared constants & types — safe to import from the edge
 * proxy (`middleware.ts`) because it pulls in NO Node-only dependencies (the
 * `@simplewebauthn/server` runtime lives only in `actions/webauthn.ts`).
 */

/** Short-lived httpOnly cookie holding the active registration/auth challenge. */
export const WEBAUTHN_CHALLENGE_COOKIE = "webauthn_challenge";

/** httpOnly cookie marking the PWA as unlocked after a successful Face ID check. */
export const APP_UNLOCKED_COOKIE = "app_unlocked";

/**
 * httpOnly flag cookie: the user has at least one passkey, so the unlock gate is
 * active. Not security-sensitive — forging it only adds an unlock prompt over an
 * already-valid Supabase session (RLS still guards the data).
 */
export const HAS_PASSKEY_COOKIE = "has_passkey";

/** How long an unlock lasts before Face ID is required again (seconds). */
export const APP_UNLOCK_MAX_AGE = 60 * 60 * 12; // 12 hours

/** Challenge lifetime (seconds). */
export const WEBAUTHN_CHALLENGE_MAX_AGE = 60 * 5; // 5 minutes

/** A passkey as shown to the user in the management UI. */
export type PasskeySummary = {
  id: string;
  nickname: string | null;
  created_at: string;
  last_used_at: string | null;
  backed_up: boolean;
};
