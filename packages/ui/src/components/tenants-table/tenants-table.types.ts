import type { TenantStats } from "@repo/database/types";

export type TenantsTableProps = {
  /** Stable id, forwarded to `data-cy` on the root element. */
  id: string;
  /** One row per tenant, from `get_tenant_stats`. */
  tenants: TenantStats[];
};
