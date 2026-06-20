import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CentralSidebar } from "../central-sidebar";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));
vi.mock("@repo/database/actions/auth", () => ({ signOut: vi.fn() }));

const profile = { full_name: "Sam Super", email: "super@leavicy.test" };

describe("CentralSidebar", () => {
  it("sets data-component and forwards id to data-cy on the root", () => {
    const { container } = render(
      <CentralSidebar id="central-sidebar" profile={profile} />,
    );
    const root = container.querySelector("[data-component='CentralSidebar']");
    expect(root).not.toBeNull();
    expect(root?.getAttribute("data-cy")).toBe("central-sidebar");
  });

  it("renders the Dashboard and Tenants nav links", () => {
    render(<CentralSidebar id="central-sidebar" profile={profile} />);
    expect(
      screen.getByRole("link", { name: "Dashboard" }).getAttribute("href"),
    ).toBe("/dashboard");
    expect(
      screen.getByRole("link", { name: "Tenants" }).getAttribute("href"),
    ).toBe("/tenants");
  });

  it("shows the signed-in super-admin profile", () => {
    render(<CentralSidebar id="central-sidebar" profile={profile} />);
    expect(screen.getByText("Sam Super")).toBeTruthy();
    expect(screen.getByText("Super-admin")).toBeTruthy();
  });
});
