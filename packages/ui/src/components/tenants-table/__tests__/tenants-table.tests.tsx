import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TenantsTable } from "../tenants-table";
import { setTenantStatus } from "@repo/database/actions/tenants";
import type { TenantStats } from "@repo/database/types";

vi.mock("@repo/database/actions/tenants", () => ({
  setTenantStatus: vi.fn(),
  createTenant: vi.fn(),
  updateTenant: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const mockedSetStatus = vi.mocked(setTenantStatus);

function tenant(over: Partial<TenantStats>): TenantStats {
  return {
    org_id: "00000000-0000-0000-0000-000000000001",
    name: "Acme",
    slug: "acme",
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    member_count: 2,
    request_count: 0,
    pending_count: 0,
    ...over,
  };
}

describe("TenantsTable", () => {
  beforeEach(() => mockedSetStatus.mockReset());

  it("sets data-component and forwards id to data-cy on the root", () => {
    const { container } = render(<TenantsTable id="tenants-table" tenants={[]} />);
    const root = container.querySelector("[data-component='TenantsTable']");
    expect(root).not.toBeNull();
    expect(root?.getAttribute("data-cy")).toBe("tenants-table");
  });

  it("shows an empty state when there are no tenants", () => {
    render(<TenantsTable id="tenants-table" tenants={[]} />);
    expect(screen.getByText(/no tenants yet/i)).toBeTruthy();
  });

  it("renders a row per tenant with its status and member count", () => {
    render(
      <TenantsTable
        id="tenants-table"
        tenants={[tenant({ name: "Acme", member_count: 4 })]}
      />,
    );
    expect(screen.getByText("Acme")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
  });

  it("hides archived tenants by default and reveals them via the toggle", () => {
    render(
      <TenantsTable
        id="tenants-table"
        tenants={[tenant({ name: "Old Co", slug: "old", status: "archived" })]}
      />,
    );
    expect(screen.queryByText("Old Co")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /show archived/i }));
    expect(screen.getByText("Old Co")).toBeTruthy();
  });

  it("suspends an active tenant via its row action", async () => {
    mockedSetStatus.mockResolvedValue({ ok: true });
    const { container } = render(
      <TenantsTable id="tenants-table" tenants={[tenant({ slug: "acme" })]} />,
    );
    const btn = container.querySelector(
      "#suspend-tenant-acme",
    ) as HTMLButtonElement;
    expect(btn).not.toBeNull();
    fireEvent.click(btn);
    await waitFor(() =>
      expect(mockedSetStatus).toHaveBeenCalledWith(
        "00000000-0000-0000-0000-000000000001",
        "suspended",
      ),
    );
  });

  it("opens the create dialog from the toolbar button", () => {
    render(<TenantsTable id="tenants-table" tenants={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /create tenant/i }));
    expect(screen.getByRole("heading", { name: "Create tenant" })).toBeTruthy();
  });
});
