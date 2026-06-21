"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Fingerprint, LogOut, AlertCircle } from "lucide-react";
import { startAuthentication } from "@simplewebauthn/browser";
import {
  Button,
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@repo/ui";
import {
  getAuthenticationOptions,
  verifyAuthentication,
} from "@repo/database/actions/webauthn";
import { signOut } from "@repo/database/actions/auth";
import type { BiometricUnlockProps } from "./biometric-unlock.types";

/**
 * Lock screen shown by `/unlock`. Verifies Face ID over the existing Supabase
 * session and, on success, returns the user to where they were headed. The
 * Supabase session is never touched here — only the UI lock is lifted.
 */
export function BiometricUnlock({
  id,
  redirectedFrom,
}: BiometricUnlockProps): React.JSX.Element {
  const router = useRouter();
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // WebAuthn requires a user gesture, so unlocking is tap-initiated (no auto
  // prompt on mount — browsers would reject a gesture-less credentials.get()).
  const unlock = async (): Promise<void> => {
    setError(null);
    setBusy(true);
    try {
      const options = await getAuthenticationOptions();
      const response = await startAuthentication({ optionsJSON: options });
      const { verified } = await verifyAuthentication(response);
      if (!verified) {
        setError("Το ξεκλείδωμα απέτυχε. Δοκιμάστε ξανά.");
        return;
      }
      router.replace(redirectedFrom);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error && err.name === "NotAllowedError"
          ? "Η ενέργεια ακυρώθηκε."
          : "Δεν ήταν δυνατό το ξεκλείδωμα.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card data-component="BiometricUnlock" data-cy={id}>
      <CardHeader className="items-center text-center">
        <span className="mb-2 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#5EEAD4] to-[#0E9488] text-white">
          <Fingerprint className="size-6" aria-hidden />
        </span>
        <CardTitle className="text-base">Ξεκλείδωμα</CardTitle>
        <CardDescription>
          Επιβεβαιώστε με Face ID για να συνεχίσετε.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          id="unlock-faceid-button"
          data-cy="unlock-faceid-button"
          type="button"
          className="w-full"
          onClick={unlock}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Fingerprint className="size-4" />
          )}
          {busy ? "Έλεγχος…" : "Ξεκλείδωμα με Face ID"}
        </Button>

        <form action={signOut}>
          <Button
            id="unlock-signout-button"
            data-cy="unlock-signout-button"
            type="submit"
            variant="ghost"
            className="w-full"
          >
            <LogOut className="size-4" />
            Αποσύνδεση
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
