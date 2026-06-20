import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { InputField } from "../input-field";

function registration(name: string): UseFormRegisterReturn {
  return { name, onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() };
}

describe("InputField", () => {
  it("sets data-component and forwards id to data-cy on the root", () => {
    const { container } = render(
      <InputField id="email" label="Email" registration={registration("email")} />,
    );
    const root = container.querySelector("[data-component='InputField']");
    expect(root).not.toBeNull();
    expect(root?.getAttribute("data-cy")).toBe("email");
  });

  it("renders a label bound to the input and forwards native input props", () => {
    render(
      <InputField
        id="email"
        label="Email"
        type="email"
        placeholder="you@company.com"
        registration={registration("email")}
      />,
    );
    const input = screen.getByLabelText("Email") as HTMLInputElement;
    expect(input.id).toBe("email");
    expect(input.type).toBe("email");
    expect(input.placeholder).toBe("you@company.com");
    expect(input.name).toBe("email");
  });

  it("shows the error message and marks the input invalid when an error is passed", () => {
    render(
      <InputField
        id="email"
        label="Email"
        registration={registration("email")}
        error={{ type: "manual", message: "Enter a valid email address." }}
      />,
    );
    expect(screen.getByText("Enter a valid email address.")).toBeTruthy();
    expect(
      screen.getByLabelText("Email").getAttribute("aria-invalid"),
    ).toBe("true");
  });

  it("does not render a visibility toggle for non-password fields", () => {
    render(
      <InputField id="email" label="Email" type="email" registration={registration("email")} />,
    );
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("toggles password visibility via a clickable eye button with stable ids", () => {
    render(
      <InputField
        id="password"
        label="Password"
        type="password"
        registration={registration("password")}
      />,
    );
    const input = screen.getByLabelText("Password") as HTMLInputElement;
    expect(input.type).toBe("password");

    const toggle = screen.getByRole("button", { name: /show password/i });
    expect(toggle.getAttribute("id")).toBe("password-toggle-visibility");
    expect(toggle.getAttribute("data-cy")).toBe("password-toggle-visibility");
    expect(toggle.getAttribute("type")).toBe("button");

    fireEvent.click(toggle);
    expect(input.type).toBe("text");
    expect(screen.getByRole("button", { name: /hide password/i })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /hide password/i }));
    expect(input.type).toBe("password");
  });
});
