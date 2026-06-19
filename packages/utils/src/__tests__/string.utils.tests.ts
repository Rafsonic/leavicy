import { describe, expect, it } from "vitest";

import {
  capitalize,
  initials,
  isBlank,
  slugify,
  titleCase,
  truncate,
} from "../string.utils";

describe("isBlank", () => {
  it("treats null, undefined, and whitespace as blank", () => {
    expect(isBlank(null)).toBe(true);
    expect(isBlank(undefined)).toBe(true);
    expect(isBlank("   ")).toBe(true);
    expect(isBlank(" x ")).toBe(false);
  });
});

describe("capitalize / titleCase", () => {
  it("capitalizes the first character", () => {
    expect(capitalize("hello")).toBe("Hello");
    expect(capitalize("")).toBe("");
  });

  it("title-cases each word", () => {
    expect(titleCase("the QUICK brown")).toBe("The Quick Brown");
  });
});

describe("truncate", () => {
  it("leaves short strings untouched", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates with the suffix counted within the limit", () => {
    expect(truncate("hello world", 8)).toBe("hello w…");
    expect(truncate("hello world", 8).length).toBe(8);
  });
});

describe("slugify", () => {
  it("produces URL-friendly slugs", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
    expect(slugify("  Crème Brûlée  ")).toBe("creme-brulee");
  });
});

describe("initials", () => {
  it("takes up to `max` uppercase initials", () => {
    expect(initials("Jane Mary Doe")).toBe("JM");
    expect(initials("Jane Mary Doe", 3)).toBe("JMD");
    expect(initials("madonna")).toBe("M");
  });
});
