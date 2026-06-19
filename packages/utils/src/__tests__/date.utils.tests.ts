import { describe, expect, it } from "vitest";

import {
  addDays,
  differenceInCalendarDays,
  formatDate,
  formatDateTime,
  isSameDay,
  isWeekend,
  startOfWeek,
  toDate,
  toISODateString,
} from "../date.utils";

describe("toDate", () => {
  it("passes through a cloned Date", () => {
    const original = new Date("2026-06-19T10:00:00Z");
    const result = toDate(original);
    expect(result.getTime()).toBe(original.getTime());
    expect(result).not.toBe(original);
  });

  it("parses ISO strings and epoch ms", () => {
    expect(toDate("2026-06-19").getUTCFullYear()).toBe(2026);
    expect(toDate(0).getTime()).toBe(0);
  });

  it("throws on invalid input", () => {
    expect(() => toDate("not-a-date")).toThrow(RangeError);
  });
});

describe("formatDate / formatDateTime", () => {
  it("formats dd/mm/yyyy in the Cyprus timezone", () => {
    expect(formatDate("2026-06-19T09:00:00Z")).toBe("19/06/2026");
  });

  it("formats date + 24h time", () => {
    // 09:00 UTC is 12:00 in Europe/Nicosia (UTC+3 in summer).
    expect(formatDateTime("2026-06-19T09:00:00Z")).toBe("19/06/2026, 12:00");
  });
});

describe("toISODateString", () => {
  it("returns yyyy-mm-dd with zero padding", () => {
    expect(toISODateString(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("addDays", () => {
  it("adds and subtracts without mutating the input", () => {
    const start = new Date(2026, 5, 19);
    expect(toISODateString(addDays(start, 5))).toBe("2026-06-24");
    expect(toISODateString(addDays(start, -19))).toBe("2026-05-31");
    expect(toISODateString(start)).toBe("2026-06-19");
  });
});

describe("differenceInCalendarDays", () => {
  it("counts whole calendar days, signed", () => {
    expect(differenceInCalendarDays(new Date(2026, 5, 19), new Date(2026, 5, 24))).toBe(5);
    expect(differenceInCalendarDays(new Date(2026, 5, 24), new Date(2026, 5, 19))).toBe(-5);
    expect(differenceInCalendarDays(new Date(2026, 5, 19), new Date(2026, 5, 19))).toBe(0);
  });
});

describe("isSameDay / isWeekend", () => {
  it("compares calendar days", () => {
    expect(isSameDay(new Date(2026, 5, 19, 1), new Date(2026, 5, 19, 23))).toBe(true);
    expect(isSameDay(new Date(2026, 5, 19), new Date(2026, 5, 20))).toBe(false);
  });

  it("detects weekends (2026-06-20 is a Saturday)", () => {
    expect(isWeekend(new Date(2026, 5, 20))).toBe(true);
    expect(isWeekend(new Date(2026, 5, 19))).toBe(false);
  });
});

describe("startOfWeek", () => {
  it("snaps back to Monday at midnight", () => {
    // 2026-06-19 is a Friday → Monday is 2026-06-15.
    const monday = startOfWeek(new Date(2026, 5, 19, 14, 30));
    expect(toISODateString(monday)).toBe("2026-06-15");
    expect(monday.getHours()).toBe(0);
    expect(monday.getMinutes()).toBe(0);
  });

  it("keeps a Monday on the same day", () => {
    expect(toISODateString(startOfWeek(new Date(2026, 5, 15)))).toBe("2026-06-15");
  });
});
