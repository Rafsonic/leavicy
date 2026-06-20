import { describe, it, expect } from "vitest";
import { loginSchema } from "../login-form.utils";

describe("loginSchema", () => {
  it("accepts a valid email and a non-empty password", () => {
    const result = loginSchema.safeParse({
      email: "jane@acme.test",
      password: "secret",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email with a helpful message", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "secret",
    });
    expect(result.success).toBe(false);
    const messages = result.success
      ? []
      : result.error.issues.map((i) => i.message);
    expect(messages).toContain("Enter a valid email address.");
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({
      email: "jane@acme.test",
      password: "",
    });
    expect(result.success).toBe(false);
    const messages = result.success
      ? []
      : result.error.issues.map((i) => i.message);
    expect(messages).toContain("Password is required.");
  });
});
