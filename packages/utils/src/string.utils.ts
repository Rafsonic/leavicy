/** String helpers — small, pure, reusable. */

/** True when the value is empty or only whitespace. */
export function isBlank(value: string | null | undefined): boolean {
  return value == null || value.trim().length === 0;
}

/** Uppercase the first character, leave the rest untouched. */
export function capitalize(value: string): string {
  if (value.length === 0) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Capitalize the first letter of each whitespace-separated word. */
export function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((word) => capitalize(word.toLowerCase()))
    .join(" ");
}

/** Truncate to `maxLength` chars, appending `suffix` (counted within the limit). */
export function truncate(value: string, maxLength: number, suffix: string = "…"): string {
  if (value.length <= maxLength) {
    return value;
  }
  if (maxLength <= suffix.length) {
    return suffix.slice(0, maxLength);
  }
  return value.slice(0, maxLength - suffix.length) + suffix;
}

/** URL-friendly slug: lowercased, accent-stripped, non-alphanumerics → single hyphens. */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Up to `max` uppercase initials from a name (e.g. `"Jane Mary Doe"` → `"JM"`). */
export function initials(value: string, max: number = 2): string {
  return value
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .slice(0, max)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}
