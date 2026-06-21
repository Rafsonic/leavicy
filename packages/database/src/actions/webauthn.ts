"use server";

import { cookies } from "next/headers";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type AuthenticatorTransportFuture,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/server";
import { isoBase64URL, isoUint8Array } from "@simplewebauthn/server/helpers";
import { createClient } from "../server";
import { getCurrentUser } from "../dal";
import {
  WEBAUTHN_CHALLENGE_COOKIE,
  WEBAUTHN_CHALLENGE_MAX_AGE,
  APP_UNLOCKED_COOKIE,
  APP_UNLOCK_MAX_AGE,
  HAS_PASSKEY_COOKIE,
  type PasskeySummary,
} from "../webauthn.shared";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

/**
 * Relying-Party config. In production set `WEBAUTHN_RP_ID` to the bare domain
 * (e.g. `portal.leavicy.com`) and `WEBAUTHN_ORIGIN` to the full https origin.
 * Defaults target local dev on the Portal port (3560).
 */
function rpConfig(): { rpID: string; rpName: string; origin: string } {
  return {
    rpID: process.env.WEBAUTHN_RP_ID ?? "localhost",
    rpName: process.env.WEBAUTHN_RP_NAME ?? "Leavicy Portal",
    origin: process.env.WEBAUTHN_ORIGIN ?? "http://localhost:3560",
  };
}

function storeChallenge(cookieStore: CookieStore, challenge: string): void {
  cookieStore.set(WEBAUTHN_CHALLENGE_COOKIE, challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: WEBAUTHN_CHALLENGE_MAX_AGE,
  });
}

function markUnlocked(cookieStore: CookieStore): void {
  cookieStore.set(APP_UNLOCKED_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: APP_UNLOCK_MAX_AGE,
  });
}

function setHasPasskey(cookieStore: CookieStore, has: boolean): void {
  if (has) {
    cookieStore.set(HAS_PASSKEY_COOKIE, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  } else {
    cookieStore.delete(HAS_PASSKEY_COOKIE);
  }
}

// ---------------------------------------------------------------------------
// Enrolment (registration) — run while the user is logged in via password.
// ---------------------------------------------------------------------------

/** Build WebAuthn registration options for a platform authenticator (Face ID). */
export async function getRegistrationOptions(): Promise<PublicKeyCredentialCreationOptionsJSON> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("webauthn_credentials")
    .select("id, transports")
    .eq("user_id", user.id);

  const { rpID, rpName } = rpConfig();
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: user.email ?? user.id,
    userID: isoUint8Array.fromUTF8String(user.id),
    attestationType: "none",
    excludeCredentials: (existing ?? []).map((c) => ({
      id: c.id,
      transports: (c.transports ?? []) as AuthenticatorTransportFuture[],
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "required",
      authenticatorAttachment: "platform", // Face ID / Touch ID, not a roaming key
    },
  });

  const cookieStore = await cookies();
  storeChallenge(cookieStore, options.challenge);
  return options;
}

/** Verify the registration response and persist the credential. */
export async function verifyRegistration(
  response: RegistrationResponseJSON,
  nickname?: string,
): Promise<{ verified: boolean }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const cookieStore = await cookies();
  const expectedChallenge = cookieStore.get(WEBAUTHN_CHALLENGE_COOKIE)?.value;
  if (!expectedChallenge) throw new Error("Challenge expired — please try again");

  const { rpID, origin } = rpConfig();
  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
  });

  cookieStore.delete(WEBAUTHN_CHALLENGE_COOKIE);
  if (!verification.verified || !verification.registrationInfo) {
    return { verified: false };
  }

  const { credential, credentialDeviceType, credentialBackedUp } =
    verification.registrationInfo;

  const supabase = await createClient();
  const { error } = await supabase.from("webauthn_credentials").insert({
    id: credential.id,
    user_id: user.id,
    public_key: isoBase64URL.fromBuffer(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports ?? [],
    device_type: credentialDeviceType,
    backed_up: credentialBackedUp,
    nickname: nickname?.trim() || null,
  });
  if (error) throw new Error(error.message);

  // The user now has a passkey: turn the gate on and treat this freshly verified
  // session as already unlocked.
  setHasPasskey(cookieStore, true);
  markUnlocked(cookieStore);
  return { verified: true };
}

// ---------------------------------------------------------------------------
// Unlock (authentication) — verify Face ID over an existing Supabase session.
// ---------------------------------------------------------------------------

/** Build WebAuthn authentication options for the current user's credentials. */
export async function getAuthenticationOptions(): Promise<PublicKeyCredentialRequestOptionsJSON> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const supabase = await createClient();
  const { data: creds } = await supabase
    .from("webauthn_credentials")
    .select("id, transports")
    .eq("user_id", user.id);

  const { rpID } = rpConfig();
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: (creds ?? []).map((c) => ({
      id: c.id,
      transports: (c.transports ?? []) as AuthenticatorTransportFuture[],
    })),
  });

  const cookieStore = await cookies();
  storeChallenge(cookieStore, options.challenge);
  return options;
}

/** Verify the assertion and, on success, mark the PWA as unlocked. */
export async function verifyAuthentication(
  response: AuthenticationResponseJSON,
): Promise<{ verified: boolean }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const cookieStore = await cookies();
  const expectedChallenge = cookieStore.get(WEBAUTHN_CHALLENGE_COOKIE)?.value;
  if (!expectedChallenge) throw new Error("Challenge expired — please try again");

  const supabase = await createClient();
  const { data: cred } = await supabase
    .from("webauthn_credentials")
    .select("*")
    .eq("id", response.id)
    .eq("user_id", user.id)
    .single();
  if (!cred) throw new Error("Credential not recognised");

  const { rpID, origin } = rpConfig();
  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
    credential: {
      id: cred.id,
      publicKey: isoBase64URL.toBuffer(cred.public_key),
      counter: Number(cred.counter),
      transports: (cred.transports ?? []) as AuthenticatorTransportFuture[],
    },
  });

  cookieStore.delete(WEBAUTHN_CHALLENGE_COOKIE);
  if (!verification.verified) return { verified: false };

  await supabase
    .from("webauthn_credentials")
    .update({
      counter: verification.authenticationInfo.newCounter,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", cred.id);

  markUnlocked(cookieStore);
  return { verified: true };
}

// ---------------------------------------------------------------------------
// Management
// ---------------------------------------------------------------------------

/** Re-lock the PWA (clears the unlocked cookie); next nav requires Face ID. */
// react-doctor-disable-next-line server-auth-actions -- cookie-only re-lock, no data access; nothing to authorize
export async function lockApp(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(APP_UNLOCKED_COOKIE);
}

/** List the current user's enrolled passkeys. */
export async function listPasskeys(): Promise<PasskeySummary[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("webauthn_credentials")
    .select("id, nickname, created_at, last_used_at, backed_up")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  return data ?? [];
}

/** Remove a passkey; disables the unlock gate once the last one is gone. */
export async function removePasskey(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const supabase = await createClient();
  await supabase
    .from("webauthn_credentials")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  const { count } = await supabase
    .from("webauthn_credentials")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const cookieStore = await cookies();
  if (!count) {
    setHasPasskey(cookieStore, false);
    cookieStore.delete(APP_UNLOCKED_COOKIE);
  }
}
