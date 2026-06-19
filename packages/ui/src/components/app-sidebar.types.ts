import type { AppRole } from "@repo/database/types";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  show: (role: AppRole) => boolean;
};

export type SidebarProps = {
  profile: { full_name: string | null; email: string | null };
  activeOrg: { id: string; name: string };
  role: AppRole;
  memberships: { org_id: string; name: string; role: AppRole }[];
};
