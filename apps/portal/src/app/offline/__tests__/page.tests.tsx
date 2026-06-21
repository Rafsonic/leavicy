import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";
import OfflinePage from "../page";

type MockButtonProps = React.ComponentProps<"button"> & {
  "data-cy"?: string;
};

vi.mock("@repo/ui", () => ({
  Button: (props: MockButtonProps) => (
    <button
      id={props.id}
      type={props.type}
      data-testid={props["data-cy"]}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  ),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("OfflinePage", () => {
  it("renders the offline message", () => {
    render(<OfflinePage />);
    expect(screen.getByText("Είστε εκτός σύνδεσης")).toBeTruthy();
  });

  it("reloads the page when retry is pressed", () => {
    const reload = vi.fn();
    Object.defineProperty(window, "location", {
      value: { ...window.location, reload },
      configurable: true,
    });

    render(<OfflinePage />);
    act(() => {
      fireEvent.click(screen.getByTestId("offline-retry-button"));
    });
    expect(reload).toHaveBeenCalledOnce();
  });
});
