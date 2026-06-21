import { describe, it, expect } from "vitest";
import { safeInternalPath } from "../unlock.utils";

describe("safeInternalPath", () => {
  it("keeps an internal path", () => {
    expect(safeInternalPath("/dashboard")).toBe("/dashboard");
  });

  it("falls back to root when undefined", () => {
    expect(safeInternalPath(undefined)).toBe("/");
  });

  it("rejects protocol-relative URLs", () => {
    expect(safeInternalPath("//evil.com")).toBe("/");
  });

  it("rejects absolute external URLs", () => {
    expect(safeInternalPath("https://evil.com")).toBe("/");
  });

  it("rejects empty string", () => {
    expect(safeInternalPath("")).toBe("/");
  });
});
