"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, signup, type AuthState } from "@repo/database/actions/auth";
import { Input } from "./input";
import { Label } from "./label";
import { Checkbox } from "./checkbox";
import { Alert, AlertDescription } from "./alert";
import { SubmitButton } from "./submit-button";
import { AlertCircle } from "lucide-react";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? login : signup;
  const [state, formAction] = useActionState<AuthState, FormData>(
    action,
    undefined,
  );
  const [agreed, setAgreed] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {mode === "signup" && (
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            name="full_name"
            placeholder="Jane Doe"
            autoComplete="name"
            required
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
        />
      </div>

      {mode === "signup" && (
        <div className="flex items-start gap-2">
          <Checkbox
            id="consent"
            name="consent"
            checked={agreed}
            onCheckedChange={(v) => setAgreed(v === true)}
            className="mt-0.5"
          />
          <Label
            htmlFor="consent"
            className="text-sm font-normal text-muted-foreground"
          >
            I agree to the{" "}
            <Link
              href="/privacy"
              target="_blank"
              className="text-foreground underline"
            >
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link
              href="/cookies"
              target="_blank"
              className="text-foreground underline"
            >
              Cookie Policy
            </Link>
            .
          </Label>
        </div>
      )}

      <SubmitButton
        className="w-full"
        disabled={mode === "signup" && !agreed}
        pendingText={mode === "login" ? "Signing in…" : "Creating account…"}
      >
        {mode === "login" ? "Sign in" : "Create account"}
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            No account?{" "}
            <Link href="/signup" className="text-foreground underline">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-foreground underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
