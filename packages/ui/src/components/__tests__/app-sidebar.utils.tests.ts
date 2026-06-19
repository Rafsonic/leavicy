import { describe, it, expect } from "vitest";
import { initials } from "../app-sidebar.utils";

describe("initials", () => {
  it("uses up to two name parts", () => {
    expect(initials("Alice Admin", "a@b.com")).toBe("AA");
  });

  it("falls back to the email when name is missing", () => {
    expect(initials(null, "nina@acme.test")).toBe("N");
  });

  it("returns '?' when both are missing", () => {
    expect(initials(null, null)).toBe("?");
  });
});
