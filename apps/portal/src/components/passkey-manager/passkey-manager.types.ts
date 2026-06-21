import type { PasskeySummary } from "@repo/database/webauthn.shared";

export type PasskeyManagerProps = {
  /** Stable id forwarded to the root element. */
  id: string;
  /** Server-fetched passkeys for the current user. */
  initialPasskeys: PasskeySummary[];
};
