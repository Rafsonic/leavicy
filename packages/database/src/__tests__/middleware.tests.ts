import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Supabase SSR client so updateSession runs without a live backend.
const getUser = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({ auth: { getUser } })),
}));

import { NextRequest } from "next/server";
import { updateSession } from "../middleware";

const request = (path: string): NextRequest =>
  new NextRequest(new URL(`http://localhost:3560${path}`));

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
