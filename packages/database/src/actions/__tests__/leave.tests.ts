import { describe, it, expect, vi, beforeEach } from "vitest";

const eqResult: { error: { message: string } | null } = { error: null };
const eq = vi.fn(() => Promise.resolve(eqResult));
const update = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ update }));
vi.mock("../../server", () => ({
  createClient: vi.fn(async () => ({ from })),
}));

const getActiveMembership = vi.fn();
vi.mock("../../dal", () => ({
  getActiveMembership: () => getActiveMembership(),
}));

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

import { cancelLeaveRequest } from "../leave";

const MEMBERSHIP = { org_id: "org-1", role: "employee" };

beforeEach(() => {
  vi.clearAllMocks();
  eqResult.error = null;
  getActiveMembership.mockResolvedValue(MEMBERSHIP);
});

describe("cancelLeaveRequest", () => {
  it("throws when there is no active membership", async () => {
    getActiveMembership.mockResolvedValue(null);
    await expect(cancelLeaveRequest("lr-1")).rejects.toThrow(
      "No active company.",
    );
    expect(from).not.toHaveBeenCalled();
  });

  it("cancels the request for an authenticated member", async () => {
    await cancelLeaveRequest("lr-1");
    expect(from).toHaveBeenCalledWith("leave_requests");
    expect(update).toHaveBeenCalledWith({ status: "cancelled" });
    expect(eq).toHaveBeenCalledWith("id", "lr-1");
    expect(revalidatePath).toHaveBeenCalledWith("/requests");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePath).toHaveBeenCalledWith("/calendar");
  });

  it("surfaces a database error", async () => {
    eqResult.error = { message: "denied" };
    await expect(cancelLeaveRequest("lr-1")).rejects.toThrow("denied");
  });
});
