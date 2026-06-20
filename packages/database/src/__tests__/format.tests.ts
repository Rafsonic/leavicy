import { describe, it, expect } from "vitest";
import {
  workingDaysBetween,
  formatDate,
  formatDateRange,
  todayISO,
} from "../format";

// 2024-01-01 is a Monday, so the week Mon–Fri is deterministic here.
describe("workingDaysBetween", () => {
  it("counts inclusive weekdays (Mon–Fri = 5)", () => {
    expect(workingDaysBetween("2024-01-01", "2024-01-05")).toBe(5);
  });

  it("excludes weekends (Sat–Sun = 0)", () => {
    expect(workingDaysBetween("2024-01-06", "2024-01-07")).toBe(0);
  });

  it("a full Mon–Sun week is still 5 working days", () => {
    expect(workingDaysBetween("2024-01-01", "2024-01-07")).toBe(5);
  });

  it("a single weekday is 1", () => {
    expect(workingDaysBetween("2024-01-01", "2024-01-01")).toBe(1);
  });

  it("returns 0 when end is before start", () => {
    expect(workingDaysBetween("2024-01-05", "2024-01-01")).toBe(0);
  });

  it("excludes a company closed day that falls on a weekday", () => {
    // Mon–Fri = 5, with Wed (2024-01-03) closed -> 4
    expect(workingDaysBetween("2024-01-01", "2024-01-05", ["2024-01-03"])).toBe(4);
  });

  it("ignores closed days that fall on a weekend (already excluded)", () => {
    // 2024-01-06 is a Saturday; closing it changes nothing
    expect(workingDaysBetween("2024-01-01", "2024-01-07", ["2024-01-06"])).toBe(5);
  });

  it("ignores closed days outside the range", () => {
    expect(workingDaysBetween("2024-01-01", "2024-01-05", ["2024-02-01"])).toBe(5);
  });

  it("returns 0 when every weekday in range is closed", () => {
    expect(
      workingDaysBetween("2024-01-01", "2024-01-02", ["2024-01-01", "2024-01-02"]),
    ).toBe(0);
  });
});

describe("formatDate / formatDateRange", () => {
  it("formats a single date (en-GB)", () => {
    expect(formatDate("2024-01-01")).toBe("01 Jan 2024");
  });

  it("collapses an equal range to a single date", () => {
    expect(formatDateRange("2024-01-01", "2024-01-01")).toBe("01 Jan 2024");
  });

  it("renders a real range with an en-dash", () => {
    expect(formatDateRange("2024-01-01", "2024-01-05")).toContain("–");
  });
});

describe("todayISO", () => {
  it("returns a YYYY-MM-DD string", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
