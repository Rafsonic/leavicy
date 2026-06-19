import { describe, expect, it } from "vitest";

import {
  clamp,
  formatNumber,
  isFiniteNumber,
  parseNumber,
  roundTo,
  sum,
} from "../number.utils";

describe("isFiniteNumber", () => {
  it("accepts only finite numbers", () => {
    expect(isFiniteNumber(42)).toBe(true);
    expect(isFiniteNumber(Number.NaN)).toBe(false);
    expect(isFiniteNumber(Infinity)).toBe(false);
    expect(isFiniteNumber("42")).toBe(false);
  });
});

describe("clamp", () => {
  it("constrains to the range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it("throws when min exceeds max", () => {
    expect(() => clamp(5, 10, 0)).toThrow(RangeError);
  });
});

describe("roundTo", () => {
  it("rounds to the requested precision without float drift", () => {
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(2.5)).toBe(3);
    expect(roundTo(1.2345, 3)).toBe(1.235);
  });
});

describe("sum", () => {
  it("adds the list, empty → 0", () => {
    expect(sum([1, 2, 3])).toBe(6);
    expect(sum([])).toBe(0);
  });
});

describe("formatNumber", () => {
  it("groups thousands (en-GB)", () => {
    expect(formatNumber(1234567.89)).toBe("1,234,567.89");
  });
});

describe("parseNumber", () => {
  it("parses loose numeric strings", () => {
    expect(parseNumber("1,234.50")).toBe(1234.5);
    expect(parseNumber("€42")).toBe(42);
    expect(parseNumber("-7")).toBe(-7);
  });

  it("returns null when nothing numeric is present", () => {
    expect(parseNumber("abc")).toBeNull();
    expect(parseNumber("")).toBeNull();
  });
});
