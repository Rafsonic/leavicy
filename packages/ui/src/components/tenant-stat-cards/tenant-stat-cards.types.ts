import type { PlatformStats } from "@repo/database/types";

export type TenantStatCardsProps = {
  /** Stable id, forwarded to `data-cy` on the root element. */
  id: string;
  /** Platform-wide aggregate stats from `get_platform_stats`. */
  stats: PlatformStats;
};
