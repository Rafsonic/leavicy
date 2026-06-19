/** Build up-to-two-letter initials from a name, falling back to email. */
export function initials(name: string | null, email: string | null): string {
  const base = name?.trim() || email || "?";
  return base
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
