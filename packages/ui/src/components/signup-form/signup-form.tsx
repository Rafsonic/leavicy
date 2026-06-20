"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import { signup } from "@repo/database/actions/auth";
import { Button } from "../button";
import { Label } from "../label";
import { Checkbox } from "../checkbox";
import { Alert, AlertDescription } from "../alert";
import { InputField } from "../input-field/input-field";
import { signupSchema, type SignupValues } from "./signup-form.utils";
import type { SignupFormProps } from "./signup-form.types";

export function SignupForm({ id }: SignupFormProps): React.JSX.Element {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: standardSchemaResolver(signupSchema),
    defaultValues: { full_name: "", email: "", password: "", consent: false },
  });

  const onSubmit = async (values: SignupValues): Promise<void> => {
    setServerError(null);
    const formData = new FormData();
    formData.set("full_name", values.full_name);
    formData.set("email", values.email);
    formData.set("password", values.password);
    formData.set("consent", "on");
    const result = await signup(undefined, formData);
    if (result?.error) setServerError(result.error);
  };

  return (
    <form
      id={id}
      data-cy={id}
      data-component="SignupForm"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-4"
    >
      {serverError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <InputField
        id="full_name"
        label="Full name"
        placeholder="Jane Doe"
        autoComplete="name"
        registration={register("full_name")}
        error={errors.full_name}
      />

      <InputField
        id="email"
        label="Email"
        type="email"
        placeholder="you@company.com"
        autoComplete="email"
        registration={register("email")}
        error={errors.email}
      />

      <InputField
        id="password"
        label="Password"
        type="password"
        placeholder="••••••••"
        autoComplete="new-password"
        registration={register("password")}
        error={errors.password}
      />

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Controller
            control={control}
            name="consent"
            render={({ field }) => (
              <Checkbox
                id="consent"
                name="consent"
                data-cy="signup-consent-checkbox"
                checked={field.value}
                onCheckedChange={(v) => field.onChange(v === true)}
                onBlur={field.onBlur}
                className="mt-0.5"
              />
            )}
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
        {errors.consent && (
          <p className="text-sm text-destructive">{errors.consent.message}</p>
        )}
      </div>

      <Button
        id="signup-submit-button"
        data-cy="signup-submit-button"
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
