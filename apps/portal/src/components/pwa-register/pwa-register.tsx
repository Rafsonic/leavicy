"use client";

import { useEffect } from "react";
import type { PwaRegisterProps } from "./pwa-register.types";

// Registers the service worker that powers offline support. Renders no visible
// UI — just a hidden marker so it can be targeted in tests.
export function PwaRegister({
  id,
  swUrl = "/sw.js",
}: PwaRegisterProps): React.ReactElement | null {
  useEffect(() => {
    // `navigator.serviceWorker` is undefined in insecure contexts (HTTP off
    // localhost), so check the value itself, not just `in navigator`.
    if (typeof window === "undefined" || !navigator.serviceWorker) {
      return;
    }
    // Capture the container so cleanup uses the same reference we subscribed on.
    const container = navigator.serviceWorker;

    const register = async (): Promise<void> => {
      try {
        const registration = await container.register(swUrl, {
          scope: "/",
          updateViaCache: "none",
        });

        // When a new worker takes over, reload once so the user runs fresh code.
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && container.controller) {
              installing.postMessage("SKIP_WAITING");
            }
          });
        });
      } catch {
        // Registration is best-effort; the app works fine without the SW.
      }
    };

    let reloading = false;
    const onControllerChange = (): void => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    // Reload only when an *updated* worker takes over a page that was already
    // controlled. On a first visit the page is uncontrolled, and the SW's
    // initial `clients.claim()` fires controllerchange too — reloading there
    // would bounce every new visitor (and breaks in-flight form submits).
    if (container.controller) {
      container.addEventListener("controllerchange", onControllerChange);
    }

    void register();

    return () => {
      container.removeEventListener("controllerchange", onControllerChange);
    };
  }, [swUrl]);

  return <span data-component="PwaRegister" data-cy={id} hidden aria-hidden />;
}
