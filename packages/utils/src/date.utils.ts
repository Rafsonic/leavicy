/**
 * Date helpers — defaults to the product locale (Cyprus / EU):
 * `en-GB` formatting (dd/mm/yyyy), `Europe/Nicosia` timezone, week starts Monday.
 */

import { DEFAULT_LOCALE } from "./number.utils";

export { DEFAULT_LOCALE };
export const DEFAULT_TIME_ZONE = "Europe/Nicosia";

const MS_PER_DAY = 86_400_000;

export type DateInput = Date | string | number;

/** Coerce a `Date | ISO string | epoch ms` into a valid `Date`. Throws on invalid input. */
export function toDate(value: DateInput): Date {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`Invalid date input: ${String(value)}`);
  }
  return date;
}

/** Format as `dd/mm/yyyy` (en-GB) in the given timezone (defaults to Cyprus). */
export function formatDate(value: DateInput, timeZone: string = DEFAULT_TIME_ZONE): string {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone,
  }).format(toDate(value));
}

/** Format as `dd/mm/yyyy, HH:mm` (24h, en-GB) in the given timezone (defaults to Cyprus). */
export function formatDateTime(value: DateInput, timeZone: string = DEFAULT_TIME_ZONE): string {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(toDate(value));
}

/** Calendar date as `yyyy-mm-dd` (from the date's local parts — no timezone shift). */
export function toISODateString(value: DateInput): string {
  const date = toDate(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Return a new `Date` with `days` added (negative subtracts). Does not mutate the input. */
export function addDays(value: DateInput, days: number): Date {
  const date = toDate(value);
  date.setDate(date.getDate() + days);
  return date;
}

/** Whole calendar days from `from` to `to` (DST-safe). Positive when `to` is later. */
export function differenceInCalendarDays(from: DateInput, to: DateInput): number {
  const a = toDate(from);
  const b = toDate(to);
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / MS_PER_DAY);
}

/** True when both inputs fall on the same calendar day. */
export function isSameDay(a: DateInput, b: DateInput): boolean {
  return toISODateString(a) === toISODateString(b);
}

/** True when the date falls on a Saturday or Sunday. */
export function isWeekend(value: DateInput): boolean {
  const day = toDate(value).getDay();
  return day === 0 || day === 6;
}

/** Start of the ISO week (Monday, 00:00:00.000 local). Does not mutate the input. */
export function startOfWeek(value: DateInput): Date {
  const date = toDate(value);
  const day = date.getDay();
  const diff = (day + 6) % 7; // days since Monday
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
}
