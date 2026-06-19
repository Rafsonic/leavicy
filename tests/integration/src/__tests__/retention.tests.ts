import { describe, it, expect, afterAll } from "vitest";
import { adminClient, ACME_ORG, USERS } from "../helpers";

const admin = adminClient();

const dateDaysAgo = (n: number): string =>
  new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
const tsDaysAgo = (n: number): string =>
  new Date(Date.now() - n * 86_400_000).toISOString();

async function seed(row: Record<string, unknown>): Promise<string> {
  const { data, error } = await admin
    .from("leave_requests")
    .insert({
      org_id: ACME_ORG,
      user_id: USERS.acmeNurse,
      leave_type: "sick",
      working_days: 1,
      ...row,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data!.id as string;
}

describe("purge_expired_data (GDPR retention)", () => {
  const ids: { a?: string; b?: string; c?: string } = {};

  afterAll(async () => {
    const toDelete = [ids.a, ids.b, ids.c].filter(Boolean) as string[];
    if (toDelete.length) {
      await admin.from("leave_requests").delete().in("id", toDelete);
    }
  });

  it("deletes old cancelled, scrubs old reasons, clears expired notes", async () => {
    // A — cancelled ~7 months ago → hard deleted
    ids.a = await seed({
      start_date: dateDaysAgo(220),
      end_date: dateDaysAgo(220),
      status: "cancelled",
      created_at: tsDaysAgo(220),
    });
    // B — approved, end_date ~25 months ago, with reason → reason scrubbed
    ids.b = await seed({
      start_date: dateDaysAgo(760),
      end_date: dateDaysAgo(760),
      status: "approved",
      reason: "old reason",
      created_at: tsDaysAgo(760),
    });
    // C — approved, end_date ~13 months ago, with a note → note path cleared
    ids.c = await seed({
      start_date: dateDaysAgo(400),
      end_date: dateDaysAgo(400),
      status: "approved",
      doctor_note_path: `${ACME_ORG}/${USERS.acmeNurse}/old.pdf`,
      created_at: tsDaysAgo(400),
    });

    const { data: result, error } = await admin.rpc("purge_expired_data");
    expect(error).toBeNull();
    expect(result).toBeTruthy();

    const { data: a } = await admin
      .from("leave_requests")
      .select("id")
      .eq("id", ids.a)
      .maybeSingle();
    expect(a).toBeNull();

    const { data: b } = await admin
      .from("leave_requests")
      .select("reason")
      .eq("id", ids.b)
      .single();
    expect(b!.reason).toBeNull();

    const { data: c } = await admin
      .from("leave_requests")
      .select("doctor_note_path")
      .eq("id", ids.c)
      .single();
    expect(c!.doctor_note_path).toBeNull();
  });
});
