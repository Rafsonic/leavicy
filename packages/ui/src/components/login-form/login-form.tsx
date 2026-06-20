"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import { login } from "@repo/database/actions/auth";
import { Button } from "../button";
import { Alert, AlertDescription } from "../alert";
import { InputField } from "../input-field/input-field";
import { loginSchema, type LoginValues } from "./login-form.utils";
import type { LoginFormProps } from "./login-form.types";

export function LoginForm({ id }: LoginFormProps): React.JSX.Element {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: standardSchemaResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues): Promise<void> => {
    setServerError(null);
    const formData = new FormData();
    formData.set("email", values.email);
    formData.set("password", values.password);
    const result = await login(undefined, formData);
    if (result?.error) setServerError(result.error);
  };

  return (
    <form
      id={id}
      data-cy={id}
      data-component="LoginForm"
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
        autoComplete="current-password"
        registration={register("password")}
        error={errors.password}
      />

      <Button
        id="login-submit-button"
        data-cy="login-submit-button"
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/signup" className="text-foreground underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
