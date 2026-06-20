import { describe, it, expect } from "vitest";
import { tenantSchema } from "../tenant-form-dialog.utils";

describe("tenantSchema", () => {
  it("accepts a valid tenant (name, slug, status)", () => {
    const result = tenantSchema.safeParse({
      name: "Acme Health",
      slug: "acme-health",
      status: "active",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty slug (auto-generated server-side on create)", () => {
    const result = tenantSchema.safeParse({
      name: "Acme Health",
      slug: "",
      status: "active",
    });
    expect(result.success).toBe(true);
  });

  it("requires a non-empty name", () => {
    const result = tenantSchema.safeParse({
      name: "",
      slug: "acme",
      status: "active",
    });
    expect(result.success).toBe(false);
    const messages = result.success
      ? []
      : result.error.issues.map((i) => i.message);
    expect(messages).toContain("Tenant name is required.");
  });

  it("rejects a slug with invalid characters", () => {
    const result = tenantSchema.safeParse({
      name: "Acme",
      slug: "Acme Health!",
      status: "active",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown status", () => {
    const result = tenantSchema.safeParse({
      name: "Acme",
      slug: "acme",
      status: "deleted",
    });
    expect(result.success).toBe(false);
  });

  it("accepts each valid lifecycle status", () => {
    for (const status of ["active", "suspended", "archived"] as const) {
      expect(
        tenantSchema.safeParse({ name: "A", slug: "a", status }).success,
      ).toBe(true);
    }
  });
});
