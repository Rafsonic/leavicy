import { describe, it, expect } from "vitest";
import { signInAs, USERS } from "../helpers";

describe("export_my_data (GDPR access/portability)", () => {
  it("returns the caller's profile, memberships and own leave requests", async () => {
    const nurse = await signInAs("nurse@acme.test");
    const { data, error } = await nurse.rpc("export_my_data");
    expect(error).toBeNull();

    const payload = data as {
      profile: { id: string; email: string } | null;
      memberships: unknown[];
      leave_requests: { user_id: string }[];
    };

    expect(payload.profile?.id).toBe(USERS.acmeNurse);
    expect(payload.profile?.email).toBe("nurse@acme.test");
    expect(Array.isArray(payload.memberships)).toBe(true);
    expect(payload.memberships.length).toBeGreaterThan(0);
    // never leaks other users' requests
    expect(
      payload.leave_requests.every((r) => r.user_id === USERS.acmeNurse),
    ).toBe(true);
  });
});
