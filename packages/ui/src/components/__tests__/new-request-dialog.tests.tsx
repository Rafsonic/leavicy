import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("@repo/database/actions/leave", () => ({
  createLeaveRequest: vi.fn(async () => ({ ok: true })),
}));
vi.mock("@repo/database/format", () => ({
  todayISO: () => "2026-06-21",
  workingDaysBetween: () => 1,
}));
vi.mock("@repo/database/types", () => ({
  LEAVE_TYPES: ["sick", "vacation"],
  LEAVE_TYPE_LABELS: { sick: "Sick", vacation: "Vacation" },
}));

import { NewRequestDialog } from "../new-request-dialog";

describe("NewRequestDialog", () => {
  it("renders the trigger button (default dates initialised lazily)", () => {
    render(<NewRequestDialog />);
    const trigger = screen.getByRole("button", { name: /New request/i });
    expect(trigger).toBeTruthy();
    expect(trigger.getAttribute("id")).toBe("new-request-button");
  });

  it("accepts company closed days without throwing", () => {
    expect(() =>
      render(<NewRequestDialog closedDays={["2026-06-22"]} />),
    ).not.toThrow();
  });
});
