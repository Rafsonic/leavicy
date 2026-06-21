import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { BiometricEnroll } from "../biometric-enroll";

const browserSupportsWebAuthn = vi.fn(() => true);
const platformAuthenticatorIsAvailable = vi.fn(async () => true);
const startRegistration = vi.fn();
vi.mock("@simplewebauthn/browser", () => ({
  browserSupportsWebAuthn: () => browserSupportsWebAuthn(),
  platformAuthenticatorIsAvailable: () => platformAuthenticatorIsAvailable(),
  startRegistration: (args: unknown) => startRegistration(args),
}));

const getRegistrationOptions = vi.fn();
const verifyRegistration = vi.fn();
vi.mock("@repo/database/actions/webauthn", () => ({
  getRegistrationOptions: () => getRegistrationOptions(),
  verifyRegistration: (r: unknown) => verifyRegistration(r),
}));

type ButtonProps = React.ComponentProps<"button"> & { "data-cy"?: string };
vi.mock("@repo/ui", () => ({
  Button: (props: ButtonProps) => (
    <button
      id={props.id}
      type={props.type}
      disabled={props.disabled}
      data-testid={props["data-cy"]}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  ),
  Alert: (props: { children: React.ReactNode }) => <div role="alert">{props.children}</div>,
  AlertDescription: (props: { children: React.ReactNode }) => <span>{props.children}</span>,
}));

beforeEach(() => {
  vi.clearAllMocks();
  browserSupportsWebAuthn.mockReturnValue(true);
  platformAuthenticatorIsAvailable.mockResolvedValue(true);
  getRegistrationOptions.mockResolvedValue({ challenge: "c" });
  startRegistration.mockResolvedValue({ id: "cred" });
  verifyRegistration.mockResolvedValue({ verified: true });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("BiometricEnroll", () => {
  it("renders nothing when no platform authenticator is available", async () => {
    platformAuthenticatorIsAvailable.mockResolvedValue(false);
    const { container } = render(<BiometricEnroll id="enroll" />);
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it("renders nothing when WebAuthn is unsupported", async () => {
    browserSupportsWebAuthn.mockReturnValue(false);
    const { container } = render(<BiometricEnroll id="enroll" />);
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it("enrolls and calls onEnrolled on success", async () => {
    const onEnrolled = vi.fn();
    render(<BiometricEnroll id="enroll" onEnrolled={onEnrolled} />);

    const button = await screen.findByTestId("enroll-button");
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => expect(onEnrolled).toHaveBeenCalledOnce());
    expect(getRegistrationOptions).toHaveBeenCalledOnce();
    expect(verifyRegistration).toHaveBeenCalledWith({ id: "cred" });
  });

  it("shows an error when verification fails", async () => {
    verifyRegistration.mockResolvedValue({ verified: false });
    render(<BiometricEnroll id="enroll" />);

    const button = await screen.findByTestId("enroll-button");
    await act(async () => {
      fireEvent.click(button);
    });

    expect((await screen.findByRole("alert")).textContent).toMatch(/απέτυχε/);
  });

  it("reports a cancelled prompt gracefully", async () => {
    const err = new Error("cancelled");
    err.name = "NotAllowedError";
    startRegistration.mockRejectedValue(err);
    render(<BiometricEnroll id="enroll" />);

    const button = await screen.findByTestId("enroll-button");
    await act(async () => {
      fireEvent.click(button);
    });

    expect((await screen.findByRole("alert")).textContent).toMatch(/ακυρώθηκε/);
  });

  it("reports a generic failure for unexpected errors", async () => {
    startRegistration.mockRejectedValue(new Error("boom"));
    render(<BiometricEnroll id="enroll" />);

    const button = await screen.findByTestId("enroll-button");
    await act(async () => {
      fireEvent.click(button);
    });

    expect((await screen.findByRole("alert")).textContent).toMatch(
      /Δεν ήταν δυνατή/,
    );
  });
});
