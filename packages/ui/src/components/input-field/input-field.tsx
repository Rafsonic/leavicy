"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/utils";
import { Input } from "../input";
import { Label } from "../label";
import type { InputFieldProps } from "./input-field.types";

export function InputField({
  id,
  label,
  registration,
  error,
  type,
  className,
  ...inputProps
}: InputFieldProps): React.JSX.Element {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const isPassword = type === "password";
  const resolvedType = isPassword && showPassword ? "text" : type;

  return (
    <div data-component="InputField" data-cy={id} className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={resolvedType}
          className={cn(isPassword && "pr-9", className)}
          {...inputProps}
          {...registration}
          aria-invalid={!!error}
        />
        {isPassword && (
          <button
            id={`${id}-toggle-visibility`}
            data-cy={`${id}-toggle-visibility`}
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        )}
      </div>
      {error?.message && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
    </div>
  );
}
