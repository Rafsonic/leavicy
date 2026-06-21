import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
const createLeaveRequest = vi.fn(async () => ({ ok: true }));
vi.mock("@repo/database/actions/leave", () => ({
  createLeaveRequest: (...args: unknown[]) => createLeaveRequest(...args),
}));
vi.mock("@repo/database/format", () => ({
  todayISO: () => "2026-06-21",
  workingDaysBetween: () => 1,
}));
vi.mock("@repo/database/types", () => ({
  LEAVE_TYPES: ["sick", "vacation"],
  LEAVE_TYPE_LABELS: { sick: "Sick", vacation: "Vacation" },
}));

import { toast } from "sonner";
import { NewRequestDialog } from "../new-request-dialog";

const openDialog = async (): Promise<void> => {
  fireEvent.click(screen.getByRole("button", { name: /New request/i }));
  await screen.findByLabelText("From");
};

beforeEach(() => {
  vi.clearAllMocks();
  createLeaveRequest.mockResolvedValue({ ok: true });
});

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

  it("opens the form with the lazily initialised default dates", async () => {
    render(<NewRequestDialog />);
    await openDialog();

    expect(screen.getByLabelText<HTMLInputElement>("From").value).toBe(
      "2026-06-21",
    );
    expect(screen.getByLabelText<HTMLInputElement>("To").value).toBe(
      "2026-06-21",
    );
  });

  it("pulls the end date forward when a later start date is picked", async () => {
    render(<NewRequestDialog />);
    await openDialog();

    const from = screen.getByLabelText<HTMLInputElement>("From");
    const to = screen.getByLabelText<HTMLInputElement>("To");

    // Later start than the current end → end is pulled forward to match.
    fireEvent.change(from, { target: { value: "2026-06-25" } });
    expect(from.value).toBe("2026-06-25");
    expect(to.value).toBe("2026-06-25");

    // Earlier start than the current end → end is left untouched.
    fireEvent.change(from, { target: { value: "2026-06-23" } });
    expect(from.value).toBe("2026-06-23");
    expect(to.value).toBe("2026-06-25");
  });

  it("edits the end date and the reason independently", async () => {
    render(<NewRequestDialog />);
    await openDialog();

    const to = screen.getByLabelText<HTMLInputElement>("To");
    fireEvent.change(to, { target: { value: "2026-06-24" } });
    expect(to.value).toBe("2026-06-24");

    const reason = screen.getByLabelText<HTMLTextAreaElement>(
      "Reason (optional)",
    );
    fireEvent.change(reason, { target: { value: "Flu symptoms" } });
    expect(reason.value).toBe("Flu symptoms");
  });

  it("submits the request and resets the form on success", async () => {
    render(<NewRequestDialog />);
    await openDialog();

    fireEvent.change(screen.getByLabelText("Reason (optional)"), {
      target: { value: "Flu symptoms" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Submit request/i }));
    });

    expect(createLeaveRequest).toHaveBeenCalledOnce();
    const fd = createLeaveRequest.mock.calls[0]?.[1] as FormData;
    expect(fd.get("leave_type")).toBe("sick");
    expect(fd.get("reason")).toBe("Flu symptoms");
    expect(toast.success).toHaveBeenCalledOnce();

    // Dialog closed after success.
    await waitFor(() => {
      expect(screen.queryByLabelText("From")).toBeNull();
    });
  });

  it("surfaces the server error and keeps the dialog open", async () => {
    createLeaveRequest.mockResolvedValueOnce({ error: "Overlapping leave" });
    render(<NewRequestDialog />);
    await openDialog();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Submit request/i }));
    });

    expect(toast.error).toHaveBeenCalledWith("Overlapping leave");
    // Still open — the form was not reset/closed.
    expect(screen.getByLabelText("From")).toBeTruthy();
  });
});
