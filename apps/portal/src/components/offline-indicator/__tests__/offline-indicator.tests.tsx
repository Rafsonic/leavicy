import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { OfflineIndicator } from "../offline-indicator";

vi.mock("@repo/ui", () => ({
  cn: (...classes: Array<string | false | undefined>): string =>
    classes.filter(Boolean).join(" "),
}));

const setOnline = (online: boolean): void => {
  Object.defineProperty(window.navigator, "onLine", {
    value: online,
    configurable: true,
  });
};

afterEach(() => {
  setOnline(true);
});

describe("OfflineIndicator", () => {
  it("renders nothing while online", () => {
    setOnline(true);
    const { container } = render(<OfflineIndicator id="offline-indicator" />);
    expect(container.firstChild).toBeNull();
  });

  it("shows the banner when offline on mount", () => {
    setOnline(false);
    render(<OfflineIndicator id="offline-indicator" />);
    expect(screen.getByRole("status")).toBeTruthy();
    expect(
      screen.getByText(/εμφανίζονται αποθηκευμένα δεδομένα/),
    ).toBeTruthy();
  });

  it("reacts to offline and online events", () => {
    setOnline(true);
    render(<OfflineIndicator id="offline-indicator" />);
    expect(screen.queryByRole("status")).toBeNull();

    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByRole("status")).toBeTruthy();

    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event("online"));
    });
    expect(screen.queryByRole("status")).toBeNull();
  });
});
