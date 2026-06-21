import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const requireUser = vi.fn();
const getProfile = vi.fn();
vi.mock("@repo/database/dal", () => ({
  requireUser: () => requireUser(),
  getProfile: () => getProfile(),
}));

const listPasskeys = vi.fn();
vi.mock("@repo/database/actions/webauthn", () => ({
  listPasskeys: () => listPasskeys(),
}));

type Props = { children?: React.ReactNode };
vi.mock("@repo/ui", () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  DataExportButton: () => <button type="button">export</button>,
  DeleteAccountButton: () => <button type="button">delete</button>,
  Card: ({ children }: Props) => <div>{children}</div>,
  CardContent: ({ children }: Props) => <div>{children}</div>,
  CardDescription: ({ children }: Props) => <div>{children}</div>,
  CardHeader: ({ children }: Props) => <div>{children}</div>,
  CardTitle: ({ children }: Props) => <div>{children}</div>,
}));

vi.mock("@/components/passkey-manager/passkey-manager", () => ({
  PasskeyManager: () => <div>passkeys</div>,
}));

import AccountPage from "../page";

beforeEach(() => {
  vi.clearAllMocks();
  requireUser.mockResolvedValue({ id: "u-1", email: "user@acme.test" });
  getProfile.mockResolvedValue({ full_name: "Full Name" });
  listPasskeys.mockResolvedValue([]);
});

describe("AccountPage", () => {
  it("fetches the profile and passkeys together (parallel) and renders", async () => {
    const tree = await AccountPage();
    render(tree);

    expect(getProfile).toHaveBeenCalledTimes(1);
    expect(listPasskeys).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Privacy & data")).toBeTruthy();
    expect(screen.getByText("user@acme.test")).toBeTruthy();
  });

  it("falls back to the email when the profile has no name", async () => {
    getProfile.mockResolvedValue(null);
    const tree = await AccountPage();
    render(tree);
    expect(screen.getAllByText("user@acme.test").length).toBeGreaterThan(0);
  });
});
