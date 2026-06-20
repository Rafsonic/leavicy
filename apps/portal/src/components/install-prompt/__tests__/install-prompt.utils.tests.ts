import { describe, it, expect, vi, afterEach } from "vitest";
import { isIos, isStandalone } from "../install-prompt.utils";

const setUserAgent = (ua: string): void => {
  Object.defineProperty(window.navigator, "userAgent", {
    value: ua,
    configurable: true,
  });
};

const setMatchMedia = (matches: boolean): void => {
  window.matchMedia = vi
    .fn()
    .mockReturnValue({ matches }) as unknown as typeof window.matchMedia;
};

const setStandaloneFlag = (value: boolean | undefined): void => {
  Object.defineProperty(window.navigator, "standalone", {
    value,
    configurable: true,
  });
};

afterEach(() => {
  setMatchMedia(false);
  setStandaloneFlag(undefined);
  vi.restoreAllMocks();
});

describe("isStandalone", () => {
  it("is true when the display-mode media query matches", () => {
    setMatchMedia(true);
    expect(isStandalone()).toBe(true);
  });

  it("is true when iOS navigator.standalone is set", () => {
    setMatchMedia(false);
    setStandaloneFlag(true);
    expect(isStandalone()).toBe(true);
  });

  it("is false in a normal browser tab", () => {
    setMatchMedia(false);
    setStandaloneFlag(false);
    expect(isStandalone()).toBe(false);
  });
});

describe("isIos", () => {
  it("is true for an iPhone user agent", () => {
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X)");
    expect(isIos()).toBe(true);
  });

  it("is true for an iPad user agent", () => {
    setUserAgent("Mozilla/5.0 (iPad; CPU OS 16_4 like Mac OS X)");
    expect(isIos()).toBe(true);
  });

  it("is false for a desktop user agent", () => {
    setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)");
    expect(isIos()).toBe(false);
  });
});
