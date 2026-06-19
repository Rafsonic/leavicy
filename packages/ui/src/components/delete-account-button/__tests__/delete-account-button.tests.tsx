import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeleteAccountButton } from "../delete-account-button";

describe("DeleteAccountButton", () => {
  it("renders the trigger with stable id, data-cy and data-component", () => {
    render(<DeleteAccountButton confirmEmail="user@acme.test" />);
    const btn = screen.getByRole("button", { name: /delete my account/i });
    expect(btn.getAttribute("id")).toBe("delete-account-button");
    expect(btn.getAttribute("data-cy")).toBe("delete-account-button");
    expect(btn.getAttribute("data-component")).toBe("DeleteAccountButton");
  });
});
