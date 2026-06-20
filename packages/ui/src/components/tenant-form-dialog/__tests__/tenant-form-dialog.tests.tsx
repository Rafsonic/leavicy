import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TenantFormDialog } from "../tenant-form-dialog";
import { createTenant, updateTenant } from "@repo/database/actions/tenants";
import type { TenantStats } from "@repo/database/types";

vi.mock("@repo/database/actions/tenants", () => ({
  createTenant: vi.fn(),
  updateTenant: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const mockedCreate = vi.mocked(createTenant);
const mockedUpdate = vi.mocked(updateTenant);

const tenant: TenantStats = {
  org_id: "11111111-1111-1111-1111-111111111111",
  name: "Acme Health",
  slug: "acme-health",
  status: "active",
  created_at: "2026-01-01T00:00:00Z",
  member_count: 4,
  request_count: 6,
  pending_count: 3,
};

describe("TenantFormDialog", () => {
  beforeEach(() => {
    mockedCreate.mockReset();
    mockedUpdate.mockReset();
  });

  it("renders the create form with data-component/data-cy on the content", () => {
    const { baseElement } = render(
      <TenantFormDialog id="create-tenant-dialog" open onOpenChange={() => {}} />,
    );
    const root = baseElement.querySelector(
      "[data-component='TenantFormDialog']",
    );
    expect(root).not.toBeNull();
    expect(root?.getAttribute("data-cy")).toBe("create-tenant-dialog");
    expect(screen.getByRole("heading", { name: "Create tenant" })).toBeTruthy();
  });

  it("calls createTenant with the entered name when valid", async () => {
    mockedCreate.mockResolvedValue({ ok: true });
    render(
      <TenantFormDialog id="create-tenant-dialog" open onOpenChange={() => {}} />,
    );
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "New Co" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create tenant" }));

    await waitFor(() => expect(mockedCreate).toHaveBeenCalledTimes(1));
    const fd = mockedCreate.mock.calls[0]![1] as FormData;
    expect(fd.get("name")).toBe("New Co");
  });

  it("blocks creation and shows a validation error for an empty name", async () => {
    render(
      <TenantFormDialog id="create-tenant-dialog" open onOpenChange={() => {}} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Create tenant" }));

    expect(await screen.findByText(/tenant name is required/i)).toBeTruthy();
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("prefills and updates an existing tenant", async () => {
    mockedUpdate.mockResolvedValue({ ok: true });
    render(
      <TenantFormDialog
        id="edit-tenant-dialog"
        tenant={tenant}
        open
        onOpenChange={() => {}}
      />,
    );

    expect(screen.getByRole("heading", { name: "Edit tenant" })).toBeTruthy();
    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe(
      "Acme Health",
    );

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(mockedUpdate).toHaveBeenCalledTimes(1));
    const fd = mockedUpdate.mock.calls[0]![1] as FormData;
    expect(fd.get("org_id")).toBe(tenant.org_id);
    expect(fd.get("status")).toBe("active");
  });

  it("surfaces a server error returned by the action", async () => {
    mockedCreate.mockResolvedValue({ error: "That slug is already taken." });
    render(
      <TenantFormDialog id="create-tenant-dialog" open onOpenChange={() => {}} />,
    );
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Dup" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create tenant" }));

    expect(await screen.findByText(/slug is already taken/i)).toBeTruthy();
  });
});
