import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { BiometricUnlock } from "../biometric-unlock";

// Stable router singleton (a fresh object per call would be fine here since the
// component no longer auto-runs, but keeping it stable mirrors real behaviour).
const { router } = vi.hoisted(() => ({
  router: { replace: vi.fn(), refresh: vi.fn() },
}));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
const { replace, refresh } = router;

const startAuthentication = vi.fn();
vi.mock("@simplewebauthn/browser", () => ({
  startAuthentication: (args: unknown) => startAuthentication(args),
}));

const getAuthenticationOptions = vi.fn();
const verifyAuthentication = vi.fn();
vi.mock("@repo/database/actions/webauthn", () => ({
  getAuthenticationOptions: () => getAuthenticationOptions(),
  verifyAuthentication: (r: unknown) => verifyAuthentication(r),
}));

vi.mock("@repo/database/actions/auth", () => ({ signOut: vi.fn() }));

type ButtonProps = React.ComponentProps<"button"> & { "data-cy"?: string };
vi.mock("@repo/ui", () => {
  const passthrough = (props: { children: React.ReactNode }): React.ReactElement => (
    <div>{props.children}</div>
  );
  return {
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
    Alert: (props: { children: React.ReactNode }) => (
      <div role="alert">{props.children}</div>
    ),
    AlertDescription: passthrough,
    Card: passthrough,
    CardContent: passthrough,
    CardHeader: passthrough,
    CardTitle: passthrough,
    CardDescription: passthrough,
  };
});

const clickUnlock = async (): Promise<void> => {
  const button = await screen.findByTestId("unlock-faceid-button");
  await act(async () => {
    fireEvent.click(button);
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  getAuthenticationOptions.mockResolvedValue({ challenge: "c" });
  startAuthentication.mockResolvedValue({ id: "cred" });
  verifyAuthentication.mockResolvedValue({ verified: true });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("BiometricUnlock", () => {
  it("does not prompt automatically on mount", () => {
    render(<BiometricUnlock id="unlock" redirectedFrom="/dashboard" />);
    expect(getAuthenticationOptions).not.toHaveBeenCalled();
  });

  it("unlocks on tap and returns to the target path", async () => {
    render(<BiometricUnlock id="unlock" redirectedFrom="/dashboard" />);
    await clickUnlock();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
    expect(refresh).toHaveBeenCalled();
    expect(verifyAuthentication).toHaveBeenCalledWith({ id: "cred" });
  });

  it("shows an error when the assertion is rejected by the server", async () => {
    verifyAuthentication.mockResolvedValue({ verified: false });
    render(<BiometricUnlock id="unlock" redirectedFrom="/" />);
    await clickUnlock();
    expect((await screen.findByRole("alert")).textContent).toMatch(/απέτυχε/);
    expect(replace).not.toHaveBeenCalled();
  });

  it("reports a cancelled prompt gracefully", async () => {
    const err = new Error("cancelled");
    err.name = "NotAllowedError";
    startAuthentication.mockRejectedValue(err);
    render(<BiometricUnlock id="unlock" redirectedFrom="/" />);
    await clickUnlock();
    expect((await screen.findByRole("alert")).textContent).toMatch(/ακυρώθηκε/);
  });
});
