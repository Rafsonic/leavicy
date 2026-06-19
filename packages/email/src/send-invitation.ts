import "server-only";
import { Resend } from "resend";
import { buildInvitationEmail, type InvitationEmailParams } from "./templates";

export type SendInvitationArgs = InvitationEmailParams & { to: string };

export type SendInvitationResult =
  | { ok: true; id: string | null; skipped?: boolean }
  | { ok: false; error: string };

/**
 * Send an invitation email via Resend. No-ops gracefully (skipped) when
 * RESEND_API_KEY is not configured, so invites still work locally.
 */
export async function sendInvitationEmail(
  args: SendInvitationArgs,
): Promise<SendInvitationResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping invitation email");
    return { ok: true, id: null, skipped: true };
  }

  const from = process.env.RESEND_FROM_EMAIL ?? "Leavicy <onboarding@resend.dev>";
  const { subject, html, text } = buildInvitationEmail(args);

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: args.to,
    subject,
    html,
    text,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data?.id ?? null };
}
