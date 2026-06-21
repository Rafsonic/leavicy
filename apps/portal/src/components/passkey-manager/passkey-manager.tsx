"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@repo/ui";
import { removePasskey } from "@repo/database/actions/webauthn";
import { BiometricEnroll } from "../biometric-enroll/biometric-enroll";
import type { PasskeyManagerProps } from "./passkey-manager.types";

/** Lists the user's enrolled passkeys and lets them add/remove Face ID unlock. */
export function PasskeyManager({
  id,
  initialPasskeys,
}: PasskeyManagerProps): React.JSX.Element {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remove = (credId: string): void => {
    setRemovingId(credId);
    startTransition(async () => {
      await removePasskey(credId);
      setRemovingId(null);
      router.refresh();
    });
  };

  return (
    <div
      data-component="PasskeyManager"
      data-cy={id}
      className="space-y-4"
    >
      {initialPasskeys.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Δεν έχετε ενεργό Face ID / passkey σε αυτόν τον λογαριασμό.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {initialPasskeys.map((pk) => (
            <li
              key={pk.id}
              className="flex items-center justify-between gap-3 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {pk.nickname ?? "Passkey"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Προστέθηκε{" "}
                  {new Date(pk.created_at).toLocaleDateString("en-GB")}
                  {pk.last_used_at
                    ? ` · Τελευταία χρήση ${new Date(
                        pk.last_used_at,
                      ).toLocaleDateString("en-GB")}`
                    : ""}
                </p>
              </div>
              <Button
                id={`remove-passkey-${pk.id}-button`}
                data-cy="remove-passkey-button"
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Διαγραφή passkey"
                disabled={pending && removingId === pk.id}
                onClick={() => remove(pk.id)}
              >
                {pending && removingId === pk.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <BiometricEnroll
        id="add-passkey"
        label={
          initialPasskeys.length ? "Προσθήκη Face ID" : "Ενεργοποίηση Face ID"
        }
        onEnrolled={() => router.refresh()}
      />
    </div>
  );
}
