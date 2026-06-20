import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AppSidebar } from "../app-sidebar";
import type { SidebarProps } from "../app-sidebar.types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("@repo/database/actions/auth", () => ({
  signOut: vi.fn(),
  switchOrg: vi.fn(),
}));

const props: SidebarProps = {
  profile: { full_name: "Nina Nurse", email: "nurse@acme.test" },
  activeOrg: { id: "org-1", name: "Acme Health" },
  role: "admin",
  memberships: [
    { org_id: "org-1", name: "Acme Health", role: "admin" },
    { org_id: "org-2", name: "Globex", role: "employee" },
  ],
};

describe("AppSidebar", () => {
  it("renders the active org and the user identity", () => {
    render(<AppSidebar {...props} />);

    // Trigger button surfaces the active organisation name.
    expect(
      screen.getByRole("button", { name: /Acme Health/i }),
    ).toBeTruthy();
    // User menu trigger surfaces the profile name.
    expect(screen.getByText("Nina Nurse")).toBeTruthy();
  });

  it("opens the company switcher with a grouped label without crashing", async () => {
    render(<AppSidebar {...props} />);

    // Before the DropdownMenuGroup wrap, opening this menu threw
    // "MenuGroupContext is missing" because GroupLabel had no Group ancestor.
    fireEvent.click(screen.getByRole("button", { name: /Acme Health/i }));

    await waitFor(() => {
      expect(screen.getByText("Companies")).toBeTruthy();
    });
    // Both memberships render as switch targets under the group.
    expect(screen.getByText("Globex")).toBeTruthy();
  });
});
