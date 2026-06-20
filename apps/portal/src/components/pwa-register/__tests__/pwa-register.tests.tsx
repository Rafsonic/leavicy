import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { PwaRegister } from "../pwa-register";

type SwMock = {
  register: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  controller: ServiceWorker | null;
};

const installSwMock = (): SwMock => {
  const sw: SwMock = {
    register: vi.fn().mockResolvedValue({
      installing: null,
      addEventListener: vi.fn(),
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    controller: null,
  };
  Object.defineProperty(window.navigator, "serviceWorker", {
    value: sw,
    configurable: true,
  });
  return sw;
};

const removeSw = (): void => {
  Object.defineProperty(window.navigator, "serviceWorker", {
    value: undefined,
    configurable: true,
  });
};

beforeEach(() => {
  removeSw();
});

afterEach(() => {
  vi.clearAllMocks();
  removeSw();
});

describe("PwaRegister", () => {
  it("renders a hidden marker with the forwarded data-cy", () => {
    const { container } = render(<PwaRegister id="pwa-register" />);
    const marker = container.querySelector('[data-component="PwaRegister"]');
    expect(marker).not.toBeNull();
    expect(marker?.getAttribute("data-cy")).toBe("pwa-register");
  });

  it("registers the service worker at the given url when supported", async () => {
    const sw = installSwMock();
    render(<PwaRegister id="pwa-register" swUrl="/custom-sw.js" />);

    await waitFor(() => expect(sw.register).toHaveBeenCalledOnce());
    expect(sw.register).toHaveBeenCalledWith("/custom-sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    expect(sw.addEventListener).toHaveBeenCalledWith(
      "controllerchange",
      expect.any(Function),
    );
  });

  it("does nothing when service workers are unsupported", () => {
    // No serviceWorker on navigator → effect returns early without throwing.
    expect(() => render(<PwaRegister id="pwa-register" />)).not.toThrow();
  });
});
