/** Local `yyyy-mm-dd` for a Date (avoids the UTC shift of toISOString). */
function localISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Count working days (Mon–Fri) between two ISO dates, inclusive.
 * Company closed days (ISO `yyyy-mm-dd`) are excluded as well, so a request
 * never consumes allowance on a weekend or a public holiday / shutdown day.
 */
export function workingDaysBetween(
  start: string,
  end: string,
  closedDays: readonly string[] = [],
): number {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  if (e < s) return 0;
  const closed = new Set(closedDays);
  let count = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6 && !closed.has(localISO(cur))) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export function formatDate(iso: string): string {
  return new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString(
    "en-GB",
    { day: "2-digit", month: "short", year: "numeric" },
  );
}

export function formatDateRange(start: string, end: string): string {
  if (start === end) return formatDate(start);
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function currentYear(): number {
  return new Date().getFullYear();
}
