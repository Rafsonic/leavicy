import { describe, it, expect } from "vitest";
import { buildInvitationEmail } from "../templates";

const base = {
  orgName: "Acme Health",
  inviteUrl: "https://app.test/invite/tok123",
  role: "Manager",
};

describe("buildInvitationEmail", () => {
  it("puts the org name and app in the subject", () => {
    const { subject } = buildInvitationEmail(base);
    expect(subject).toContain("Acme Health");
    expect(subject).toContain("Leavicy");
  });

  it("includes the invite URL in both html and text", () => {
    const { html, text } = buildInvitationEmail(base);
    expect(html).toContain("https://app.test/invite/tok123");
    expect(text).toContain("https://app.test/invite/tok123");
  });

  it("mentions the inviter when provided", () => {
    const { subject, text } = buildInvitationEmail({
      ...base,
      inviterName: "Alice",
    });
    expect(subject).toContain("Alice");
    expect(text).toContain("Alice");
  });

  it("escapes HTML in user-controlled values (no injection)", () => {
    const { html } = buildInvitationEmail({
      ...base,
      orgName: "<script>alert(1)</script>",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("honors a custom app name", () => {
    const { subject } = buildInvitationEmail({ ...base, appName: "Leavicy CRM" });
    expect(subject).toContain("Leavicy CRM");
  });
});
