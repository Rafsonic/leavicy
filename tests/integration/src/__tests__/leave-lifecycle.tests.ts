import { describe, it, expect, afterEach } from "vitest";
import { signInAs, adminClient, USERS, ACME_ORG } from "../helpers";

describe("leave request lifecycle", () => {
  const created: string[] = [];

  afterEach(async () => {
    if (created.length) {
      await adminClient().from("leave_requests").delete().in("id", created);
      created.length = 0;
    }
  });

  async function createPending(client: Awaited<ReturnType<typeof signInAs>>, day: string) {
    const { data, error } = await client
      .from("leave_requests")
      .insert({
        org_id: ACME_ORG,
        user_id: USERS.acmeNurse,
        leave_type: "sick",
        start_date: day,
        end_date: day,
        working_days: 1,
        status: "pending",
      })
      .select("id, status")
      .single();
    expect(error).toBeNull();
    created.push(data!.id);
    return data!;
  }

  it("employee creates a pending request and can cancel it", async () => {
    const nurse = await signInAs("nurse@acme.test");
    const row = await createPending(nurse, "2030-03-04");
    expect(row.status).toBe("pending");

    const { data: cancelled } = await nurse
      .from("leave_requests")
      .update({ status: "cancelled" })
      .eq("id", row.id)
      .select("status")
      .single();
    expect(cancelled!.status).toBe("cancelled");
  });

  it("employee cannot self-approve (RLS keeps it pending)", async () => {
    const nurse = await signInAs("nurse@acme.test");
    const row = await createPending(nurse, "2030-04-04");

    await nurse
      .from("leave_requests")
      .update({ status: "approved" })
      .eq("id", row.id)
      .select();

    const { data: after } = await nurse
      .from("leave_requests")
      .select("status")
      .eq("id", row.id)
      .single();
    expect(after!.status).toBe("pending");
  });

  it("a manager can approve a pending request", async () => {
    const nurse = await signInAs("nurse@acme.test");
    const row = await createPending(nurse, "2030-05-06");

    const manager = await signInAs("manager@acme.test");
    const { data: approved, error } = await manager
      .from("leave_requests")
      .update({
        status: "approved",
        reviewed_by: USERS.acmeManager,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .select("status")
      .single();
    expect(error).toBeNull();
    expect(approved!.status).toBe("approved");
  });

  it("team calendar returns approved/pending entries for org members", async () => {
    const nurse = await signInAs("nurse@acme.test");
    const { data, error } = await nurse.rpc("get_team_calendar", {
      _org: ACME_ORG,
    });
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });
});
