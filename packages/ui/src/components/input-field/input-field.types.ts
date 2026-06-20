import type { ComponentProps } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

/**
 * Props for {@link InputField}: every native `<input>` prop (minus `id`, which is
 * mandatory and dedicated) plus the react-hook-form state for this field —
 * its `register(...)` wiring and the resolved validation error.
 */
export type InputFieldProps = Omit<ComponentProps<"input">, "id"> & {
  /** Stable id — drives the input id, the label `htmlFor`, and `data-cy`. Mandatory. */
  id: string;
  /** Visible label rendered above the input. */
  label: string;
  /** react-hook-form registration for this field, i.e. `register("fieldName")`. */
  registration: UseFormRegisterReturn;
  /** The field's validation error, if any — its message renders under the input. */
  error?: FieldError;
};
