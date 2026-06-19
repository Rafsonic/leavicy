export type InvitationEmailParams = {
  orgName: string;
  inviteUrl: string;
  role: string;
  inviterName?: string | null;
  appName?: string;
};

export type BuiltEmail = {
  subject: string;
  html: string;
  text: string;
};

/** Minimal HTML escaping to prevent injection of user-controlled values. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Build the invitation email (subject + html + text). Pure & testable.
 * NOTE: email clients require inline styles — this is intentionally not Tailwind.
 */
export function buildInvitationEmail(params: InvitationEmailParams): BuiltEmail {
  const app = params.appName?.trim() || "SickDesk";
  const inviter = params.inviterName?.trim();
  const org = params.orgName.trim();

  const subject = inviter
    ? `${inviter} invited you to ${org} on ${app}`
    : `You're invited to ${org} on ${app}`;

  const intro = inviter
    ? `${inviter} has invited you to join`
    : "You've been invited to join";

  const text = [
    `${intro} ${org} on ${app} as ${params.role}.`,
    "",
    `Accept your invitation: ${params.inviteUrl}`,
    "",
    "If you didn't expect this, you can ignore this email.",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:32px;">
          <tr><td style="font-size:18px;font-weight:bold;padding-bottom:16px;">${escapeHtml(app)}</td></tr>
          <tr><td style="font-size:15px;line-height:1.5;padding-bottom:24px;">
            ${escapeHtml(intro)} <strong>${escapeHtml(org)}</strong> as <strong>${escapeHtml(params.role)}</strong>.
          </td></tr>
          <tr><td style="padding-bottom:24px;">
            <a href="${escapeHtml(params.inviteUrl)}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:bold;">Accept invitation</a>
          </td></tr>
          <tr><td style="font-size:12px;color:#71717a;line-height:1.5;">
            Or paste this link into your browser:<br />
            <a href="${escapeHtml(params.inviteUrl)}" style="color:#3f3f46;">${escapeHtml(params.inviteUrl)}</a>
          </td></tr>
          <tr><td style="font-size:12px;color:#a1a1aa;padding-top:24px;">
            If you didn't expect this, you can safely ignore this email.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
