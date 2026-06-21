"use client";

import { useEffect, useState } from "react";
import { Loader2, Fingerprint, AlertCircle } from "lucide-react";
import {
  startRegistration,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from "@simplewebauthn/browser";
import { Button, Alert, AlertDescription } from "@repo/ui";
import {
  getRegistrationOptions,
  verifyRegistration,
} from "@repo/database/actions/webauthn";
import type { BiometricEnrollProps } from "./biometric-enroll.types";

/**
 * Enrols a platform authenticator (Face ID / Touch ID) for the current user.
 * Renders nothing on devices/browsers without a platform authenticator, so the
 * UI degrades gracefully (password login remains the fallback everywhere).
 */
export function BiometricEnroll({
  id,
  label = "Ενεργοποίηση Face ID",
  onEnrolled,
  className,
}: BiometricEnrollProps): React.JSX.Element | null {
  const [supported, setSupported] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const check = async (): Promise<void> => {
      const ok =
        browserSupportsWebAuthn() &&
        (await platformAuthenticatorIsAvailable());
      if (active) setSupported(ok);
    };
    void check();
    return () => {
      active = false;
    };
  }, []);

  const enroll = async (): Promise<void> => {
    setError(null);
    setBusy(true);
    try {
      const options = await getRegistrationOptions();
      const response = await startRegistration({ optionsJSON: options });
      const { verified } = await verifyRegistration(response);
      if (!verified) {
        setError("Η ενεργοποίηση απέτυχε. Δοκιμάστε ξανά.");
        return;
      }
      onEnrolled?.();
    } catch (err) {
      setError(
        err instanceof Error && err.name === "NotAllowedError"
          ? "Η ενέργεια ακυρώθηκε."
          : "Δεν ήταν δυνατή η ενεργοποίηση του Face ID.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (!supported) return null;

  return (
    <div data-component="BiometricEnroll" data-cy={id} className={className}>
      {error && (
        <Alert variant="destructive" className="mb-3">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button
        id={`${id}-button`}
        data-cy={`${id}-button`}
        type="button"
        onClick={enroll}
        disabled={busy}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Fingerprint className="size-4" />
        )}
        {busy ? "Ενεργοποίηση…" : label}
      </Button>
    </div>
  );
}
