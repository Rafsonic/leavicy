import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClosedDaysManager } from "../closed-days-manager";
import type { ClosedDay } from "@repo/database/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("@repo/database/actions/settings", () => ({
  addClosedDay: vi.fn(),
  removeClosedDay: vi.fn(),
}));

function makeDay(over: Partial<ClosedDay>): ClosedDay {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    org_id: "22222222-2222-2222-2222-222222222222",
    closed_date: "2026-12-25",
    name: "Christmas Day",
    created_at: "2026-01-01T00:00:00Z",
    ...over,
  };
}

describe("ClosedDaysManager", () => {
  it("forwards id to data-cy and sets data-component on the root", () => {
    const { container } = render(
      <ClosedDaysManager id="company-closed-days" closedDays={[]} />,
    );
    const root = container.querySelector("[data-component='ClosedDaysManager']");
    expect(root).not.toBeNull();
    expect(root?.getAttribute("data-cy")).toBe("company-closed-days");
  });

  it("shows the empty state when there are no closed days", () => {
    render(<ClosedDaysManager id="company-closed-days" closedDays={[]} />);
    expect(screen.getByText(/no closed days yet/i)).toBeTruthy();
  });

  it("lists each closed day with its formatted date and a remove button", () => {
    const { container } = render(
      <ClosedDaysManager
        id="company-closed-days"
        closedDays={[makeDay({ name: "Christmas Day", closed_date: "2026-12-25" })]}
      />,
    );
    expect(screen.getByText("Christmas Day")).toBeTruthy();
    expect(screen.getByText("25 Dec 2026")).toBeTruthy();
    const remove = container.querySelector("[data-cy='remove-closed-day-button']");
    expect(remove?.getAttribute("id")).toBe(
      "remove-closed-day-11111111-1111-1111-1111-111111111111",
    );
  });

  it("renders the add-closed-day submit button with stable id/data-cy", () => {
    const { container } = render(
      <ClosedDaysManager id="company-closed-days" closedDays={[]} />,
    );
    const add = container.querySelector("[data-cy='add-closed-day-button']");
    expect(add?.getAttribute("id")).toBe("add-closed-day-button");
  });
});
