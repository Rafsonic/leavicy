import { describe, expect, it } from "vitest";

import {
  amountToCents,
  centsToAmount,
  formatCents,
  formatCurrency,
  roundAmount,
} from "../amount.utils";

describe("formatCurrency", () => {
  it("formats EUR by default (en-GB)", () => {
    expect(formatCurrency(1234.5)).toBe("€1,234.50");
    expect(formatCurrency(0)).toBe("€0.00");
  });

  it("honours an explicit currency", () => {
    expect(formatCurrency(10, "USD")).toBe("US$10.00");
  });
});

describe("cents conversion", () => {
  it("round-trips amount ↔ cents", () => {
    expect(amountToCents(1234.5)).toBe(123450);
    expect(centsToAmount(123450)).toBe(1234.5);
    expect(centsToAmount(amountToCents(19.99))).toBe(19.99);
  });
});

describe("formatCents", () => {
  it("formats integer cents as currency", () => {
    expect(formatCents(123450)).toBe("€1,234.50");
  });
});

describe("roundAmount", () => {
  it("rounds to whole cents", () => {
    expect(roundAmount(1.005)).toBe(1.01);
    expect(roundAmount(2.1)).toBe(2.1);
  });
});
