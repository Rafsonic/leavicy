import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SignupForm } from "../signup-form";
import { signup } from "@repo/database/actions/auth";

vi.mock("@repo/database/actions/auth", () => ({
  login: vi.fn(),
  signup: vi.fn(),
}));

const mockedSignup = vi.mocked(signup);

function fillValidFields(): void {
  fireEvent.change(screen.getByLabelText("Full name"), {
    target: { value: "Jane Doe" },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "jane@acme.test" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "secret" },
  });
}

describe("SignupForm", () => {
  beforeEach(() => {
    mockedSignup.mockReset();
  });

  it("forwards id to data-cy and sets data-component on the root form", () => {
    const { container } = render(<SignupForm id="signup-form" />);
    const root = container.querySelector("[data-component='SignupForm']");
    expect(root).not.toBeNull();
    expect(root?.tagName).toBe("FORM");
    expect(root?.getAttribute("id")).toBe("signup-form");
    expect(root?.getAttribute("data-cy")).toBe("signup-form");
  });

  it("renders full name, email, password fields and the consent checkbox", () => {
    render(<SignupForm id="signup-form" />);
    expect(screen.getByLabelText("Full name")).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Password")).toBeTruthy();
    expect(screen.getByRole("checkbox")).toBeTruthy();
  });

  it("blocks submission and shows the consent error when consent is not given", async () => {
    render(<SignupForm id="signup-form" />);
    fillValidFields();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText(/accept the privacy & cookie policy/i),
    ).toBeTruthy();
    expect(mockedSignup).not.toHaveBeenCalled();
  });

  it("submits to the signup action with consent once all fields are valid", async () => {
    mockedSignup.mockResolvedValue(undefined);
    render(<SignupForm id="signup-form" />);
    fillValidFields();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(mockedSignup).toHaveBeenCalledTimes(1));
    const formData = mockedSignup.mock.calls[0]![1] as FormData;
    expect(formData.get("full_name")).toBe("Jane Doe");
    expect(formData.get("email")).toBe("jane@acme.test");
    expect(formData.get("password")).toBe("secret");
    expect(formData.get("consent")).toBe("on");
  });

  it("surfaces a server error returned by the action", async () => {
    mockedSignup.mockResolvedValue({ error: "Email already registered." });
    render(<SignupForm id="signup-form" />);
    fillValidFields();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText(/email already registered/i)).toBeTruthy();
  });

  it("links to the login page", () => {
    render(<SignupForm id="signup-form" />);
    const link = screen.getByRole("link", { name: "Sign in" });
    expect(link.getAttribute("href")).toBe("/login");
  });
});
