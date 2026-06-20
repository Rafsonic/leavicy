export type CentralSidebarProps = {
  /** Stable id, forwarded to `data-cy` on the root element. */
  id: string;
  /** The signed-in super-admin's display profile. */
  profile: { full_name: string | null; email: string | null };
};
