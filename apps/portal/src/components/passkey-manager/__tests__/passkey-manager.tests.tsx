import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { PasskeyManager } from "../passkey-manager";
import type { PasskeySummary } from "@repo/database/webauthn.shared";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const removePasskey = vi.fn();
vi.mock("@repo/database/actions/webauthn", () => ({
  removePasskey: (id: string) => removePasskey(id),
}));

// Stub the child enrol component so this suite stays focused on management.
vi.mock("../../biometric-enroll/biometric-enroll", () => ({
  BiometricEnroll: (props: { label?: string }) => (
    <div data-testid="biometric-enroll">{props.label}</div>
  ),
}));

type ButtonProps = React.ComponentProps<"button"> & { "data-cy"?: string };
vi.mock("@repo/ui", () => ({
  Button: (props: ButtonProps) => (
    <button
      id={props.id}
      type={props.type}
      disabled={props.disabled}
      aria-label={props["aria-label"]}
      data-testid={props["data-cy"]}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  ),
}));

const passkeys: PasskeySummary[] = [
  {
    id: "cred-1",
    nickname: "My iPhone",
    created_at: "2026-06-01T10:00:00.000Z",
    last_used_at: "2026-06-10T10:00:00.000Z",
    backed_up: true,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  removePasskey.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("PasskeyManager", () => {
  it("shows an empty state with an enrol prompt when there are no passkeys", () => {
    render(<PasskeyManager id="passkey-manager" initialPasskeys={[]} />);
    expect(screen.getByText(/Δεν έχετε ενεργό/)).toBeTruthy();
    expect(screen.getByTestId("biometric-enroll").textContent).toBe(
      "Ενεργοποίηση Face ID",
    );
  });

  it("lists enrolled passkeys with their nickname", () => {
    render(
      <PasskeyManager id="passkey-manager" initialPasskeys={passkeys} />,
    );
    expect(screen.getByText("My iPhone")).toBeTruthy();
    expect(screen.getByTestId("biometric-enroll").textContent).toBe(
      "Προσθήκη Face ID",
    );
  });

  it("falls back to a generic label when a passkey has no nickname or usage", () => {
    render(
      <PasskeyManager
        id="passkey-manager"
        initialPasskeys={[
          {
            id: "cred-2",
            nickname: null,
            created_at: "2026-06-01T10:00:00.000Z",
            last_used_at: null,
            backed_up: false,
          },
        ]}
      />,
    );
    expect(screen.getByText("Passkey")).toBeTruthy();
    expect(screen.queryByText(/Τελευταία χρήση/)).toBeNull();
  });

  it("removes a passkey and refreshes", async () => {
    render(
      <PasskeyManager id="passkey-manager" initialPasskeys={passkeys} />,
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId("remove-passkey-button"));
    });
    expect(removePasskey).toHaveBeenCalledWith("cred-1");
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });
});
