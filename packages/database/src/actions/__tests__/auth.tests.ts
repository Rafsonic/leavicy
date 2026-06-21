import { describe, it, expect, vi, beforeEach } from "vitest";

const cookieStore = {
  set: vi.fn(),
  delete: vi.fn(),
};
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

const redirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirect(path),
}));

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

const signInWithPassword = vi.fn();
const signUp = vi.fn();
const signOutFn = vi.fn();
vi.mock("../../server", () => ({
  createClient: vi.fn(async () => ({
    auth: { signInWithPassword, signUp, signOut: signOutFn },
  })),
}));

// auth.ts imports ACTIVE_ORG_COOKIE from ../dal, which pulls in `server-only`;
// stub it so the node test env doesn't choke on that import.
vi.mock("../../dal", () => ({ ACTIVE_ORG_COOKIE: "active_org" }));

import { login, signup, signOut } from "../auth";
import { APP_UNLOCKED_COOKIE, HAS_PASSKEY_COOKIE } from "../../webauthn.shared";

const formData = (entries: Record<string, string>): FormData => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
};

beforeEach(() => {
  vi.clearAllMocks();
  signInWithPassword.mockResolvedValue({ error: null });
  signUp.mockResolvedValue({ error: null });
  signOutFn.mockResolvedValue({ error: null });
});

describe("login", () => {
  it("requires email and password", async () => {
    const result = await login(undefined, formData({ email: "" }));
    expect(result).toEqual({ error: "Email and password are required." });
  });

  it("returns the auth error message on failure", async () => {
    signInWithPassword.mockResolvedValue({ error: { message: "bad creds" } });
    const result = await login(
      undefined,
      formData({ email: "a@b.com", password: "x" }),
    );
    expect(result).toEqual({ error: "bad creds" });
  });

  it("redirects on success", async () => {
    await login(undefined, formData({ email: "a@b.com", password: "secret" }));
    expect(redirect).toHaveBeenCalledWith("/");
  });
});

describe("signup", () => {
  it("requires all fields", async () => {
    const result = await signup(undefined, formData({ email: "a@b.com" }));
    expect(result).toEqual({ error: "All fields are required." });
  });

  it("enforces a minimum password length", async () => {
    const result = await signup(
      undefined,
      formData({ full_name: "Nina", email: "a@b.com", password: "123" }),
    );
    expect(result).toEqual({
      error: "Password must be at least 6 characters.",
    });
  });

  it("requires consent", async () => {
    const result = await signup(
      undefined,
      formData({ full_name: "Nina", email: "a@b.com", password: "secret1" }),
    );
    expect(result?.error).toContain("Privacy");
  });

  it("redirects on success", async () => {
    await signup(
      undefined,
      formData({
        full_name: "Nina",
        email: "a@b.com",
        password: "secret1",
        consent: "on",
      }),
    );
    expect(redirect).toHaveBeenCalledWith("/");
  });
});

describe("signOut", () => {
  it("clears the unlock cookies and redirects to /login", async () => {
    await signOut();
    expect(signOutFn).toHaveBeenCalled();
    expect(cookieStore.delete).toHaveBeenCalledWith(APP_UNLOCKED_COOKIE);
    expect(cookieStore.delete).toHaveBeenCalledWith(HAS_PASSKEY_COOKIE);
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
