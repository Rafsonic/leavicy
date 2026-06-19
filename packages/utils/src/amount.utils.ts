/**
 * Money helpers — defaults to the product currency (EUR) and locale (`en-GB`).
 * Monetary values are stored as integer **cents** to avoid float drift; convert
 * at the boundaries with `centsToAmount` / `amountToCents`.
 */

import { DEFAULT_LOCALE, roundTo } from "./number.utils";

export { DEFAULT_LOCALE };
export const DEFAULT_CURRENCY = "EUR";

/** Format a decimal amount as currency (e.g. `1234.5` → `€1,234.50`). */
export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

/** Format integer **cents** as currency (e.g. `123450` → `€1,234.50`). */
export function formatCents(
  cents: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
): string {
  return formatCurrency(centsToAmount(cents), currency, locale);
}

/** Integer cents → decimal amount (`123450` → `1234.5`). */
export function centsToAmount(cents: number): number {
  return roundTo(cents / 100, 2);
}

/** Decimal amount → integer cents (`1234.5` → `123450`). */
export function amountToCents(amount: number): number {
  return Math.round(amount * 100);
}

/** Round a decimal amount to whole cents (2 decimal places). */
export function roundAmount(amount: number): number {
  return roundTo(amount, 2);
}
