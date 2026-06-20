import type { TenantStats } from "@repo/database/types";

export type TenantFormDialogProps = {
  /** Stable id, forwarded to `data-cy` on the dialog content. */
  id: string;
  /** When provided the dialog edits this tenant; otherwise it creates one. */
  tenant?: TenantStats;
  /** Controlled open state. */
  open: boolean;
  /** Open-state change handler (clear the selected entity to close). */
  onOpenChange: (open: boolean) => void;
};
