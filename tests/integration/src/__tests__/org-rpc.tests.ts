import { describe, it, expect, afterEach } from "vitest";
import {
  adminClient,
  signInAs,
  createTestUser,
  deleteTestUser,
  uniqueEmail,
  ACME_ORG,
} from "../helpers";

describe("create_organization RPC", () => {
  let userId: string | null = null;
  let orgId: string | null = null;

  afterEach(async () => {
    const admin = adminClient();
    if (orgId) await admin.from("organizations").delete().eq("id", orgId);
    if (userId) await deleteTestUser(userId);
    userId = null;
    orgId = null;
  });

  it("creates an org and makes the caller an admin member", async () => {
    const email = uniqueEmail("founder");
    userId = await createTestUser(email);
    const client = await signInAs(email);

    const { data, error } = await client.rpc("create_organization", {
      _name: "Test Co",
    });
    expect(error).toBeNull();
    orgId = data as string;
    expect(orgId).toBeTruthy();

    const { data: members } = await client
      .from("memberships")
      .select("role, org_id")
      .eq("org_id", orgId);
    expect(members).toHaveLength(1);
    expect(members![0].role).toBe("admin");
  });
});

describe("accept_invitation RPC", () => {
  let userId: string | null = null;
  let inviteId: string | null = null;

  afterEach(async () => {
    const admin = adminClient();
    if (inviteId) await admin.from("invitations").delete().eq("id", inviteId);
    if (userId) await deleteTestUser(userId); // cascades membership
    userId = null;
    inviteId = null;
  });

  it("lets an invited user join with the invited role", async () => {
    const admin = await signInAs("admin@acme.test");
    const email = uniqueEmail("invitee");
    const { data: inv, error: ie } = await admin
      .from("invitations")
      .insert({ org_id: ACME_ORG, email, role: "manager" })
      .select("id, token")
      .single();
    expect(ie).toBeNull();
    inviteId = inv!.id;

    userId = await createTestUser(email);
    const invitee = await signInAs(email);
    const { data: org, error } = await invitee.rpc("accept_invitation", {
      _token: inv!.token,
    });
    expect(error).toBeNull();
    expect(org).toBe(ACME_ORG);

    const { data: members } = await invitee
      .from("memberships")
      .select("role")
      .eq("org_id", ACME_ORG)
      .eq("user_id", userId);
    expect(members).toHaveLength(1);
    expect(members![0].role).toBe("manager");
  });

  it("rejects an invitation issued for a different email", async () => {
    const admin = await signInAs("admin@acme.test");
    const email = uniqueEmail("invitee");
    const { data: inv } = await admin
      .from("invitations")
      .insert({ org_id: ACME_ORG, email, role: "employee" })
      .select("id, token")
      .single();
    inviteId = inv!.id;

    // tech@acme (a different email) tries to accept it
    const tech = await signInAs("tech@acme.test");
    const { error } = await tech.rpc("accept_invitation", {
      _token: inv!.token,
    });
    expect(error).not.toBeNull();
  });
});
