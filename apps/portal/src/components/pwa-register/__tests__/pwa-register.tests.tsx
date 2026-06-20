import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { PwaRegister } from "../pwa-register";

type Listener = (event?: unknown) => void;

type InstallingMock = {
  state: string;
  postMessage: ReturnType<typeof vi.fn>;
  addEventListener: (type: string, cb: Listener) => void;
  fire: (type: string) => void;
};

type RegistrationMock = {
  installing: InstallingMock | null;
  addEventListener: (type: string, cb: Listener) => void;
  fire: (type: string) => void;
};

type SwMock = {
  register: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  controller: object | null;
  fireController: () => void;
};

const makeListenerBag = (): {
  addEventListener: (type: string, cb: Listener) => void;
  fire: (type: string) => void;
} => {
  const bag: Record<string, Listener[]> = {};
  return {
    addEventListener: (type, cb) => {
      (bag[type] ??= []).push(cb);
    },
    fire: (type) => (bag[type] ?? []).forEach((cb) => cb()),
  };
};

const makeInstalling = (state: string): InstallingMock => {
  const bag = makeListenerBag();
  return { state, postMessage: vi.fn(), ...bag };
};

const installSwMock = (registration: RegistrationMock): SwMock => {
  const bag = makeListenerBag();
  const sw: SwMock = {
    register: vi.fn().mockResolvedValue(registration),
    addEventListener: vi.fn(bag.addEventListener),
    removeEventListener: vi.fn(),
    controller: null,
    fireController: () => bag.fire("controllerchange"),
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
    const registration: RegistrationMock = {
      installing: null,
      ...makeListenerBag(),
    };
    const sw = installSwMock(registration);
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

  it("posts SKIP_WAITING once a newly installed worker is waiting", async () => {
    const installing = makeInstalling("installed");
    const registration: RegistrationMock = {
      installing,
      ...makeListenerBag(),
    };
    const sw = installSwMock(registration);
    sw.controller = {}; // an existing controller → this is an update
    render(<PwaRegister id="pwa-register" />);

    await waitFor(() => expect(sw.register).toHaveBeenCalledOnce());
    registration.fire("updatefound");
    installing.fire("statechange");

    expect(installing.postMessage).toHaveBeenCalledWith("SKIP_WAITING");
  });

  it("does not post SKIP_WAITING when there is no installing worker", async () => {
    const registration: RegistrationMock = {
      installing: null,
      ...makeListenerBag(),
    };
    const sw = installSwMock(registration);
    render(<PwaRegister id="pwa-register" />);

    await waitFor(() => expect(sw.register).toHaveBeenCalledOnce());
    expect(() => registration.fire("updatefound")).not.toThrow();
  });

  it("reloads once when the controller changes", async () => {
    const reload = vi.fn();
    Object.defineProperty(window, "location", {
      value: { ...window.location, reload },
      configurable: true,
    });

    const registration: RegistrationMock = {
      installing: null,
      ...makeListenerBag(),
    };
    const sw = installSwMock(registration);
    render(<PwaRegister id="pwa-register" />);

    await waitFor(() => expect(sw.register).toHaveBeenCalledOnce());
    sw.fireController();
    sw.fireController(); // second change must be ignored

    expect(reload).toHaveBeenCalledOnce();
  });

  it("does nothing when service workers are unsupported", () => {
    // No serviceWorker on navigator → effect returns early without throwing.
    expect(() => render(<PwaRegister id="pwa-register" />)).not.toThrow();
  });
});
