import { describe, it, expect } from "vitest";
import { initials } from "../central-sidebar.utils";

describe("initials", () => {
  it("uses the first letters of the first two name parts", () => {
    expect(initials("Sam Super", "super@leavicy.test")).toBe("SS");
  });

  it("falls back to the email when no name is given", () => {
    expect(initials(null, "jane@acme.test")).toBe("JA");
  });

  it("takes the first two characters of a single-word name", () => {
    expect(initials("Madonna", null)).toBe("MA");
  });

  it("returns a placeholder when nothing is provided", () => {
    expect(initials(null, null)).toBe("?");
  });
});
