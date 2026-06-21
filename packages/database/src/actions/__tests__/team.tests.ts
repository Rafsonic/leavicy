import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — keep the node test env free of `server-only` / email side effects.
// ---------------------------------------------------------------------------
const eqResult: { error: { message: string } | null } = { error: null };
const eq = vi.fn(() => Promise.resolve(eqResult));
const update = vi.fn(() => ({ eq }));
const del = vi.fn(() => ({ eq }));
const insert = vi.fn(() => ({
  select: vi.fn(() => ({
    single: vi.fn(() => Promise.resolve({ data: { token: "tok" }, error: null })),
  })),
}));
const from = vi.fn(() => ({ update, delete: del, insert }));
vi.mock("../../server", () => ({
  createClient: vi.fn(async () => ({ from })),
}));

const requireAdminOrg = vi.fn();
vi.mock("../guards", () => ({ requireAdminOrg: () => requireAdminOrg() }));

vi.mock("../../dal", () => ({ getProfile: vi.fn(async () => null) }));

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({ get: () => null })),
}));

vi.mock("@repo/email/send-invitation", () => ({
  sendInvitationEmail: vi.fn(async () => undefined),
}));

import {
  cancelInvitation,
  updateMemberRole,
  updateMemberAllowance,
  removeMember,
} from "../team";

const ADMIN = { orgId: "org-1", orgName: "Acme" };
const DENIED = { error: "Only admins can manage the organization." };

beforeEach(() => {
  vi.clearAllMocks();
  eqResult.error = null;
  requireAdminOrg.mockResolvedValue(ADMIN);
});

describe("updateMemberRole", () => {
  it("rejects an invalid role before touching the database", async () => {
    await expect(
      updateMemberRole("m-1", "superuser" as never),
    ).rejects.toThrow("Invalid role");
    expect(requireAdminOrg).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it("throws when the caller is not an admin", async () => {
    requireAdminOrg.mockResolvedValue(DENIED);
    await expect(updateMemberRole("m-1", "manager")).rejects.toThrow(
      DENIED.error,
    );
    expect(from).not.toHaveBeenCalled();
  });

  it("updates the role for an admin and revalidates", async () => {
    await updateMemberRole("m-1", "manager");
    expect(from).toHaveBeenCalledWith("memberships");
    expect(update).toHaveBeenCalledWith({ role: "manager" });
    expect(eq).toHaveBeenCalledWith("id", "m-1");
    expect(revalidatePath).toHaveBeenCalledWith("/team");
  });

  it("surfaces a database error", async () => {
    eqResult.error = { message: "boom" };
    await expect(updateMemberRole("m-1", "employee")).rejects.toThrow("boom");
  });
});

describe("updateMemberAllowance", () => {
  it("throws when the caller is not an admin", async () => {
    requireAdminOrg.mockResolvedValue(DENIED);
    await expect(updateMemberAllowance("m-1", 20)).rejects.toThrow(DENIED.error);
    expect(from).not.toHaveBeenCalled();
  });

  it("updates the allowance for an admin", async () => {
    await updateMemberAllowance("m-1", 18);
    expect(update).toHaveBeenCalledWith({ annual_sick_days: 18 });
    expect(eq).toHaveBeenCalledWith("id", "m-1");
    expect(revalidatePath).toHaveBeenCalledWith("/team");
  });
});

describe("removeMember", () => {
  it("throws when the caller is not an admin", async () => {
    requireAdminOrg.mockResolvedValue(DENIED);
    await expect(removeMember("m-1")).rejects.toThrow(DENIED.error);
    expect(from).not.toHaveBeenCalled();
  });

  it("deletes the membership for an admin", async () => {
    await removeMember("m-1");
    expect(from).toHaveBeenCalledWith("memberships");
    expect(del).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith("id", "m-1");
    expect(revalidatePath).toHaveBeenCalledWith("/team");
  });
});

describe("cancelInvitation", () => {
  it("throws when the caller is not an admin", async () => {
    requireAdminOrg.mockResolvedValue(DENIED);
    await expect(cancelInvitation("inv-1")).rejects.toThrow(DENIED.error);
    expect(from).not.toHaveBeenCalled();
  });

  it("deletes the invitation for an admin", async () => {
    await cancelInvitation("inv-1");
    expect(from).toHaveBeenCalledWith("invitations");
    expect(del).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith("id", "inv-1");
    expect(revalidatePath).toHaveBeenCalledWith("/team");
  });
});
