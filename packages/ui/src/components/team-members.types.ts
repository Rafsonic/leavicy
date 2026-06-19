import type { AppRole } from "@repo/database/types";

export type Member = {
  membershipId: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  role: AppRole;
  annualSickDays: number;
};
