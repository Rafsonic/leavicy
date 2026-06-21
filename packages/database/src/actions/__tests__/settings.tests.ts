import { describe, it, expect, vi, beforeEach } from "vitest";

const eqResult: { error: { message: string } | null } = { error: null };
const eq = vi.fn(() => Promise.resolve(eqResult));
const del = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ delete: del }));
vi.mock("../../server", () => ({
  createClient: vi.fn(async () => ({ from })),
}));

const requireAdminOrg = vi.fn();
vi.mock("../guards", () => ({ requireAdminOrg: () => requireAdminOrg() }));

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

import { removeClosedDay } from "../settings";

const ADMIN = { orgId: "org-1", orgName: "Acme" };
const DENIED = { error: "Only admins can manage the organization." };

beforeEach(() => {
  vi.clearAllMocks();
  eqResult.error = null;
  requireAdminOrg.mockResolvedValue(ADMIN);
});

describe("removeClosedDay", () => {
  it("throws when the caller is not an admin", async () => {
    requireAdminOrg.mockResolvedValue(DENIED);
    await expect(removeClosedDay("cd-1")).rejects.toThrow(DENIED.error);
    expect(from).not.toHaveBeenCalled();
  });

  it("deletes the closed day for an admin and revalidates", async () => {
    await removeClosedDay("cd-1");
    expect(from).toHaveBeenCalledWith("company_closed_days");
    expect(del).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith("id", "cd-1");
    expect(revalidatePath).toHaveBeenCalledWith("/team");
  });

  it("surfaces a database error", async () => {
    eqResult.error = { message: "nope" };
    await expect(removeClosedDay("cd-1")).rejects.toThrow("nope");
  });
});
