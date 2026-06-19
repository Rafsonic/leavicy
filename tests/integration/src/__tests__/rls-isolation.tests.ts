import { describe, it, expect } from "vitest";
import { signInAs, USERS, ACME_ORG, GLOBEX_ORG } from "../helpers";

describe("RLS tenant isolation", () => {
  it("employee sees only their own leave requests", async () => {
    const nurse = await signInAs("nurse@acme.test");
    const { data, error } = await nurse
      .from("leave_requests")
      .select("user_id");
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
    expect((data ?? []).every((r) => r.user_id === USERS.acmeNurse)).toBe(true);
  });

  it("manager sees org-wide requests, all within their org", async () => {
    const mgr = await signInAs("manager@acme.test");
    const { data } = await mgr
      .from("leave_requests")
      .select("org_id")
      .eq("org_id", ACME_ORG);
    expect((data ?? []).length).toBeGreaterThan(0);
    expect((data ?? []).every((r) => r.org_id === ACME_ORG)).toBe(true);
  });

  it("a different tenant's admin cannot read Acme requests", async () => {
    const globex = await signInAs("admin@globex.test");
    const { data } = await globex
      .from("leave_requests")
      .select("id")
      .eq("org_id", ACME_ORG);
    expect(data ?? []).toHaveLength(0);
  });

  it("cannot read another tenant's calendar via rpc", async () => {
    const nurse = await signInAs("nurse@acme.test");
    const { data } = await nurse.rpc("get_team_calendar", { _org: GLOBEX_ORG });
    expect(data ?? []).toHaveLength(0);
  });

  it("only own-tenant memberships are visible", async () => {
    const globex = await signInAs("admin@globex.test");
    const { data } = await globex.from("memberships").select("org_id");
    expect((data ?? []).every((m) => m.org_id === GLOBEX_ORG)).toBe(true);
  });
});
