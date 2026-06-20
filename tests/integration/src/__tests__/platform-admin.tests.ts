import { describe, it, expect, afterEach } from "vitest";
import type { TenantStats } from "@repo/database/types";
import {
  adminClient,
  anonClient,
  signInAs,
  ACME_ORG,
  GLOBEX_ORG,
} from "../helpers";

const SUPER = "raf3sg@gmail.com";
const SUPER_PASSWORD = "Leavicy2026!";

describe("platform admin — super-admin manages all tenants", () => {
  let createdOrgId: string | null = null;

  afterEach(async () => {
    if (createdOrgId) {
      await adminClient().from("organizations").delete().eq("id", createdOrgId);
      createdOrgId = null;
    }
  });

  it("reports is_platform_admin = true for the seeded super-admin", async () => {
    const c = await signInAs(SUPER, SUPER_PASSWORD);
    const { data, error } = await c.rpc("is_platform_admin");
    expect(error).toBeNull();
    expect(data).toBe(true);
  });

  it("sees ALL organizations across tenants", async () => {
    const c = await signInAs(SUPER, SUPER_PASSWORD);
    const { data, error } = await c.from("organizations").select("id");
    expect(error).toBeNull();
    const ids = (data ?? []).map((o) => o.id);
    expect(ids).toContain(ACME_ORG);
    expect(ids).toContain(GLOBEX_ORG);
  });

  it("returns platform-wide stats", async () => {
    const c = await signInAs(SUPER, SUPER_PASSWORD);
    const { data, error } = await c.rpc("get_platform_stats");
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].total_tenants).toBeGreaterThanOrEqual(2);
    expect(data![0].total_users).toBeGreaterThanOrEqual(2);
  });

  it("returns per-tenant stats with counts", async () => {
    const c = await signInAs(SUPER, SUPER_PASSWORD);
    const { data, error } = await c.rpc("get_tenant_stats");
    expect(error).toBeNull();
    const acme = ((data ?? []) as TenantStats[]).find(
      (t) => t.org_id === ACME_ORG,
    );
    expect(acme).toBeTruthy();
    expect(acme!.member_count).toBeGreaterThanOrEqual(1);
  });

  it("creates, updates and archives a tenant", async () => {
    const c = await signInAs(SUPER, SUPER_PASSWORD);

    const { data: newId, error: ce } = await c.rpc("admin_create_tenant", {
      _name: "Integration Test Tenant",
    });
    expect(ce).toBeNull();
    createdOrgId = newId as string;
    expect(createdOrgId).toBeTruthy();

    const { data: created } = await c
      .from("organizations")
      .select("status")
      .eq("id", createdOrgId)
      .single();
    expect(created!.status).toBe("active");

    const slug = `renamed-${Date.now()}`;
    const { error: ue } = await c.rpc("admin_update_tenant", {
      _org: createdOrgId,
      _name: "Renamed Tenant",
      _slug: slug,
      _status: "suspended",
    });
    expect(ue).toBeNull();

    const { error: se } = await c.rpc("admin_set_tenant_status", {
      _org: createdOrgId,
      _status: "archived",
    });
    expect(se).toBeNull();

    const { data: after } = await c
      .from("organizations")
      .select("name, slug, status")
      .eq("id", createdOrgId)
      .single();
    expect(after!.name).toBe("Renamed Tenant");
    expect(after!.slug).toBe(slug);
    expect(after!.status).toBe("archived");
  });
});

describe("platform admin — tenant users and anonymous are denied", () => {
  it("a tenant admin is NOT a platform admin", async () => {
    const c = await signInAs("admin@acme.test");
    const { data } = await c.rpc("is_platform_admin");
    expect(data).toBe(false);
  });

  it("a tenant admin still sees only their own org", async () => {
    const c = await signInAs("admin@acme.test");
    const { data } = await c.from("organizations").select("id");
    const ids = (data ?? []).map((o) => o.id);
    expect(ids).toContain(ACME_ORG);
    expect(ids).not.toContain(GLOBEX_ORG);
  });

  it("rejects every tenant-admin attempt at the platform RPCs", async () => {
    const c = await signInAs("admin@acme.test");

    expect((await c.rpc("admin_create_tenant", { _name: "Hacme" })).error).not.toBeNull();
    expect(
      (
        await c.rpc("admin_update_tenant", {
          _org: GLOBEX_ORG,
          _name: "x",
          _slug: "x",
          _status: "active",
        })
      ).error,
    ).not.toBeNull();
    expect(
      (await c.rpc("admin_set_tenant_status", { _org: GLOBEX_ORG, _status: "archived" })).error,
    ).not.toBeNull();
    expect((await c.rpc("get_platform_stats")).error).not.toBeNull();
    expect((await c.rpc("get_tenant_stats")).error).not.toBeNull();
  });

  it("rejects the platform RPCs for an anonymous client", async () => {
    const c = anonClient();
    expect((await c.rpc("admin_create_tenant", { _name: "Anon" })).error).not.toBeNull();
    expect((await c.rpc("get_platform_stats")).error).not.toBeNull();
  });
});
