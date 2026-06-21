import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Supabase SSR client so updateSession runs without a live backend.
const getUser = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({ auth: { getUser } })),
}));

import { NextRequest } from "next/server";
import { updateSession } from "../middleware";

const request = (path: string, cookie?: string): NextRequest =>
  new NextRequest(
    new URL(`http://localhost:3560${path}`),
    cookie ? { headers: { cookie } } : undefined,
  );

beforeEach(() => {
  // Default: unauthenticated visitor.
  getUser.mockResolvedValue({ data: { user: null } });
});

describe("updateSession route gating", () => {
  it("lets unauthenticated users reach /offline (PWA fallback)", async () => {
    const res = await updateSession(request("/offline"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects unauthenticated users away from protected routes", async () => {
    const res = await updateSession(request("/dashboard"));
    const location = res.headers.get("location");
    expect(res.status).toBe(307);
    expect(location).toContain("/login");
    expect(location).toContain("redirectedFrom=%2Fdashboard");
  });

  it("does not redirect authenticated users", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const res = await updateSession(request("/dashboard"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });
});

describe("updateSession passkey unlock gate", () => {
  beforeEach(() => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  });

  it("redirects a locked user (has passkey, not unlocked) to /unlock", async () => {
    const res = await updateSession(request("/dashboard", "has_passkey=1"));
    const location = res.headers.get("location");
    expect(res.status).toBe(307);
    expect(location).toContain("/unlock");
    expect(location).toContain("redirectedFrom=%2Fdashboard");
  });

  it("lets an unlocked user through", async () => {
    const res = await updateSession(
      request("/dashboard", "has_passkey=1; app_unlocked=1"),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("does not gate a user without a passkey", async () => {
    const res = await updateSession(request("/dashboard"));
    expect(res.status).toBe(200);
  });

  it("does not redirect /unlock onto itself", async () => {
    const res = await updateSession(request("/unlock", "has_passkey=1"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("does not gate locked users on public paths", async () => {
    const res = await updateSession(request("/privacy", "has_passkey=1"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });
});
