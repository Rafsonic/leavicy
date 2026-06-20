import { describe, it, expect } from "vitest";
import { signupSchema } from "../signup-form.utils";

const valid = {
  full_name: "Jane Doe",
  email: "jane@acme.test",
  password: "secret",
  consent: true,
};

describe("signupSchema", () => {
  it("accepts a fully valid signup payload", () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it("requires a full name", () => {
    const result = signupSchema.safeParse({ ...valid, full_name: "" });
    expect(result.success).toBe(false);
    const messages = result.success
      ? []
      : result.error.issues.map((i) => i.message);
    expect(messages).toContain("Full name is required.");
  });

  it("rejects an invalid email", () => {
    const result = signupSchema.safeParse({ ...valid, email: "nope" });
    expect(result.success).toBe(false);
    const messages = result.success
      ? []
      : result.error.issues.map((i) => i.message);
    expect(messages).toContain("Enter a valid email address.");
  });

  it("rejects a password shorter than 6 characters", () => {
    const result = signupSchema.safeParse({ ...valid, password: "12345" });
    expect(result.success).toBe(false);
    const messages = result.success
      ? []
      : result.error.issues.map((i) => i.message);
    expect(messages).toContain("Password must be at least 6 characters.");
  });

  it("requires consent to be true", () => {
    const result = signupSchema.safeParse({ ...valid, consent: false });
    expect(result.success).toBe(false);
    const messages = result.success
      ? []
      : result.error.issues.map((i) => i.message);
    expect(messages).toContain("You must accept the Privacy & Cookie Policy.");
  });
});
