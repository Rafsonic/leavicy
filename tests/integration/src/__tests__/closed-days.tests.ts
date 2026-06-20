import { describe, it, expect, afterAll } from "vitest";
import { signInAs, adminClient, ACME_ORG } from "../helpers";

// A date outside the seeded set (2026-12-25 / 2026-12-28) for write tests.
const TEST_DATE = "2026-07-01";

describe("company_closed_days RLS", () => {
  afterAll(async () => {
    // Best-effort cleanup of anything a test left behind.
    await adminClient()
      .from("company_closed_days")
      .delete()
      .eq("org_id", ACME_ORG)
      .eq("closed_date", TEST_DATE);
  });

  it("org members can read their org's closed days", async () => {
    const nurse = await signInAs("nurse@acme.test");
    const { data, error } = await nurse
      .from("company_closed_days")
      .select("org_id, closed_date, name");
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThanOrEqual(2);
    expect((data ?? []).every((d) => d.org_id === ACME_ORG)).toBe(true);
  });

  it("the action's range query returns closed days within the range", async () => {
    // Mirrors how createLeaveRequest fetches closed days for the count.
    const nurse = await signInAs("nurse@acme.test");
    const { data } = await nurse
      .from("company_closed_days")
      .select("closed_date")
      .eq("org_id", ACME_ORG)
      .gte("closed_date", "2026-12-01")
      .lte("closed_date", "2026-12-31");
    const dates = (data ?? []).map((d) => d.closed_date);
    expect(dates).toContain("2026-12-25");
    expect(dates).toContain("2026-12-28");
  });

  it("a non-admin (employee) cannot create a closed day", async () => {
    const nurse = await signInAs("nurse@acme.test");
    const { error } = await nurse
      .from("company_closed_days")
      .insert({ org_id: ACME_ORG, closed_date: TEST_DATE, name: "Nope" });
    expect(error).not.toBeNull();
  });

  it("an admin can create and delete a closed day", async () => {
    const admin = await signInAs("admin@acme.test");
    const { data: created, error: insertError } = await admin
      .from("company_closed_days")
      .insert({ org_id: ACME_ORG, closed_date: TEST_DATE, name: "Test holiday" })
      .select("id")
      .single();
    expect(insertError).toBeNull();
    expect(created?.id).toBeTruthy();

    const { error: deleteError } = await admin
      .from("company_closed_days")
      .delete()
      .eq("id", created!.id);
    expect(deleteError).toBeNull();
  });

  it("duplicate (org, date) is rejected by the unique constraint", async () => {
    const admin = await signInAs("admin@acme.test");
    const { error } = await admin
      .from("company_closed_days")
      .insert({ org_id: ACME_ORG, closed_date: "2026-12-25", name: "Dup" });
    expect(error?.code).toBe("23505");
  });

  it("a different tenant's admin cannot read or write Acme closed days", async () => {
    const globex = await signInAs("admin@globex.test");

    const { data } = await globex
      .from("company_closed_days")
      .select("id")
      .eq("org_id", ACME_ORG);
    expect(data ?? []).toHaveLength(0);

    const { error } = await globex
      .from("company_closed_days")
      .insert({ org_id: ACME_ORG, closed_date: TEST_DATE, name: "Intruder" });
    expect(error).not.toBeNull();
  });
});
