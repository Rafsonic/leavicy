import type { AppRole } from "@repo/database/types";

export type PendingInvite = {
  id: string;
  email: string;
  role: AppRole;
  token: string;
};
