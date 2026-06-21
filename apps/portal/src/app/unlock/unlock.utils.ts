// Open-redirect guard for the unlock flow: only internal, non-protocol-relative
// paths are allowed as a post-unlock destination; everything else falls back to
// the app root. Kept page-local (used only by the unlock route).

/** Returns `redirectedFrom` if it is a safe internal path, else "/". */
export const safeInternalPath = (redirectedFrom?: string): string =>
  redirectedFrom &&
  redirectedFrom.startsWith("/") &&
  !redirectedFrom.startsWith("//")
    ? redirectedFrom
    : "/";
