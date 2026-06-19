"use client";

import { useActionState } from "react";
import { acceptInvitation, type OnboardingState } from "@repo/database/actions/onboarding";
import { Alert, AlertDescription } from "./alert";
import { SubmitButton } from "./submit-button";
import { AlertCircle } from "lucide-react";

export function InviteAcceptForm({ token }: { token: string }) {
  const [state, formAction] = useActionState<OnboardingState, FormData>(
    acceptInvitation,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <input type="hidden" name="token" value={token} />
      <SubmitButton className="w-full" pendingText="Joining…">
        Accept invitation
      </SubmitButton>
    </form>
  );
}
