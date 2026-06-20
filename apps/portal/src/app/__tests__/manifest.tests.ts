import { describe, it, expect, afterEach, vi } from "vitest";
import type { MetadataRoute } from "next";

const originalAppName = process.env.NEXT_PUBLIC_APP_NAME;

// `manifest.ts` reads NEXT_PUBLIC_APP_NAME at module load, so re-import fresh
// after setting the env to exercise the name resolution.
const loadManifest = async (): Promise<() => MetadataRoute.Manifest> => {
  vi.resetModules();
  const mod = await import("../manifest");
  return mod.default;
};

afterEach(() => {
  if (originalAppName === undefined) delete process.env.NEXT_PUBLIC_APP_NAME;
  else process.env.NEXT_PUBLIC_APP_NAME = originalAppName;
});

describe("manifest", () => {
  it("describes an installable standalone PWA", async () => {
    const m = (await loadManifest())();
    expect(m.display).toBe("standalone");
    expect(m.start_url).toBe("/");
    expect(m.scope).toBe("/");
    expect(m.theme_color).toBe("#0e9488");
  });

  it("ships 192, 512 and a maskable icon", async () => {
    const icons = (await loadManifest())().icons ?? [];
    expect(icons).toHaveLength(3);
    expect(icons.map((i) => i.sizes)).toEqual([
      "192x192",
      "512x512",
      "512x512",
    ]);
    expect(icons.some((i) => i.purpose === "maskable")).toBe(true);
  });

  it("uses NEXT_PUBLIC_APP_NAME for the app name", async () => {
    process.env.NEXT_PUBLIC_APP_NAME = "Acme Leave";
    const m = (await loadManifest())();
    expect(m.short_name).toBe("Acme Leave");
    expect(m.name).toContain("Acme Leave");
  });

  it("falls back to a default name when the env var is unset", async () => {
    delete process.env.NEXT_PUBLIC_APP_NAME;
    const m = (await loadManifest())();
    expect(m.short_name).toBe("Leavicy Portal");
  });
});
