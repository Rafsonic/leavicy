import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";
import type { Mock } from "vitest";
import { InstallPrompt } from "../install-prompt";
import { isIos, isStandalone } from "../install-prompt.utils";
import type { BeforeInstallPromptEvent } from "../install-prompt.types";

vi.mock("../install-prompt.utils", () => ({
  isStandalone: vi.fn(() => false),
  isIos: vi.fn(() => false),
}));

type MockButtonProps = React.ComponentProps<"button"> & {
  "data-cy"?: string;
  size?: string;
  variant?: string;
};

vi.mock("@repo/ui", () => ({
  // Forward only DOM-safe props; expose `data-cy` as `data-testid` for queries.
  Button: (props: MockButtonProps) => (
    <button
      id={props.id}
      type={props.type}
      aria-label={props["aria-label"]}
      data-cy={props["data-cy"]}
      data-testid={props["data-cy"]}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  ),
  cn: (...classes: Array<string | false | undefined>): string =>
    classes.filter(Boolean).join(" "),
}));

const mockIsStandalone = isStandalone as Mock;
const mockIsIos = isIos as Mock;

const fireBeforeInstallPrompt = async (): Promise<BeforeInstallPromptEvent> => {
  const event = new Event("beforeinstallprompt") as BeforeInstallPromptEvent;
  event.prompt = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(event, "userChoice", {
    value: Promise.resolve({ outcome: "accepted" as const }),
  });
  await act(async () => {
    window.dispatchEvent(event);
  });
  return event;
};

beforeEach(() => {
  sessionStorage.clear();
  mockIsStandalone.mockReturnValue(false);
  mockIsIos.mockReturnValue(false);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("InstallPrompt", () => {
  it("renders nothing before an install signal arrives", () => {
    const { container } = render(<InstallPrompt id="install-prompt" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when already running standalone", async () => {
    mockIsStandalone.mockReturnValue(true);
    render(<InstallPrompt id="install-prompt" />);
    await fireBeforeInstallPrompt();
    expect(screen.queryByText("Εγκατάσταση Leavicy")).toBeNull();
  });

  it("shows the install button after beforeinstallprompt and triggers the native prompt", async () => {
    render(<InstallPrompt id="install-prompt" />);
    const event = await fireBeforeInstallPrompt();

    const installButton = screen.getByTestId("install-app-button");
    expect(installButton).toBeTruthy();

    await act(async () => {
      fireEvent.click(installButton);
    });
    expect(event.prompt).toHaveBeenCalledOnce();
  });

  it("shows manual Share instructions on iOS instead of a button", async () => {
    mockIsIos.mockReturnValue(true);
    render(<InstallPrompt id="install-prompt" />);
    await act(async () => {});

    expect(screen.getByText(/Προσθήκη στην οθόνη Αφετηρίας/)).toBeTruthy();
    expect(screen.queryByTestId("install-app-button")).toBeNull();
  });

  it("dismisses and stays dismissed for the session", async () => {
    render(<InstallPrompt id="install-prompt" />);
    await fireBeforeInstallPrompt();

    await act(async () => {
      fireEvent.click(screen.getByTestId("dismiss-install-button"));
    });

    expect(screen.queryByText("Εγκατάσταση Leavicy")).toBeNull();
    expect(sessionStorage.getItem("leavicy-install-dismissed")).toBe("1");
  });
});
