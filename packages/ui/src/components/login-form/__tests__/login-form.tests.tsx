import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginForm } from "../login-form";
import { login } from "@repo/database/actions/auth";

vi.mock("@repo/database/actions/auth", () => ({
  login: vi.fn(),
  signup: vi.fn(),
}));

const mockedLogin = vi.mocked(login);

describe("LoginForm", () => {
  beforeEach(() => {
    mockedLogin.mockReset();
  });

  it("forwards id to data-cy and sets data-component on the root form", () => {
    const { container } = render(<LoginForm id="login-form" />);
    const root = container.querySelector("[data-component='LoginForm']");
    expect(root).not.toBeNull();
    expect(root?.tagName).toBe("FORM");
    expect(root?.getAttribute("id")).toBe("login-form");
    expect(root?.getAttribute("data-cy")).toBe("login-form");
  });

  it("renders email and password fields and an enabled submit button with stable ids", () => {
    render(<LoginForm id="login-form" />);
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Password")).toBeTruthy();
    const btn = screen.getByRole("button", { name: "Sign in" });
    expect(btn.getAttribute("id")).toBe("login-submit-button");
    expect(btn.getAttribute("data-cy")).toBe("login-submit-button");
    expect((btn as HTMLButtonElement).disabled).toBe(false);
  });

  it("omits the signup-only full name field", () => {
    render(<LoginForm id="login-form" />);
    expect(screen.queryByLabelText("Full name")).toBeNull();
  });

  it("blocks submission and shows a validation error for an invalid email", async () => {
    render(<LoginForm id="login-form" />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "not-an-email" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText(/valid email/i)).toBeTruthy();
    expect(mockedLogin).not.toHaveBeenCalled();
  });

  it("calls the login action with the entered credentials when valid", async () => {
    mockedLogin.mockResolvedValue(undefined);
    render(<LoginForm id="login-form" />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "jane@acme.test" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(mockedLogin).toHaveBeenCalledTimes(1));
    const formData = mockedLogin.mock.calls[0]![1] as FormData;
    expect(formData.get("email")).toBe("jane@acme.test");
    expect(formData.get("password")).toBe("secret");
  });

  it("surfaces a server error returned by the action", async () => {
    mockedLogin.mockResolvedValue({ error: "Invalid login credentials." });
    render(<LoginForm id="login-form" />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "jane@acme.test" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText(/invalid login credentials/i)).toBeTruthy();
  });

  it("links to the signup page", () => {
    render(<LoginForm id="login-form" />);
    const link = screen.getByRole("link", { name: "Sign up" });
    expect(link.getAttribute("href")).toBe("/signup");
  });
});
