/** Number helpers — formatting defaults to the product locale (`en-GB`). */

export const DEFAULT_LOCALE = "en-GB";

/** Narrow `unknown` to a usable, finite number. */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Clamp `value` into the inclusive `[min, max]` range. */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    throw new RangeError(`clamp: min (${min}) must not exceed max (${max})`);
  }
  return Math.min(Math.max(value, min), max);
}

/** Round to `decimals` places, avoiding binary float drift (e.g. 1.005 → 1.01). */
export function roundTo(value: number, decimals: number = 0): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** Sum a list of numbers (empty list → 0). */
export function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/** Format with grouped thousands (en-GB by default). */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/** Parse a locale-formatted/loose numeric string to a number, or `null` if not parseable. */
export function parseNumber(value: string): number | null {
  const cleaned = value.replace(/[^\d.,+-]/g, "").replace(/,/g, "");
  if (cleaned === "") {
    return null;
  }
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}
