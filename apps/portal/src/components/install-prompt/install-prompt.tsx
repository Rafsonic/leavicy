"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@repo/ui";
import type {
  BeforeInstallPromptEvent,
  InstallPromptProps,
} from "./install-prompt.types";
import { isIos, isStandalone } from "./install-prompt.utils";

const DISMISS_KEY = "leavicy-install-dismissed";

// Non-intrusive prompt inviting the user to install the portal to their home
// screen. Uses the native `beforeinstallprompt` where available and falls back
// to manual Share-sheet instructions on iOS Safari.
export function InstallPrompt({
  id,
}: InstallPromptProps): React.ReactElement | null {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [showIos, setShowIos] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    const onBeforeInstall = (event: Event): void => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };

    // Detection is deferred to mount (not a lazy initializer) to avoid SSR
    // hydration mismatches — these checks read browser-only state.
    const init = (): void => {
      if (isStandalone() || sessionStorage.getItem(DISMISS_KEY) === "1") {
        setDismissed(true);
        return;
      }
      window.addEventListener("beforeinstallprompt", onBeforeInstall);
      // iOS never fires beforeinstallprompt — show manual instructions instead.
      if (isIos()) setShowIos(true);
    };
    // react-doctor-disable-next-line no-initialize-state -- intentional: these reads touch browser-only state and must run after mount to avoid SSR hydration mismatch
    init();

    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const dismiss = (): void => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  const install = async (): Promise<void> => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  if (dismissed || (!deferred && !showIos)) return null;

  return (
    <dialog
      open
      data-component="InstallPrompt"
      data-cy={id}
      aria-label="Εγκατάσταση εφαρμογής"
      className="bg-card text-card-foreground fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg sm:left-auto sm:right-4"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#5EEAD4] to-[#0E9488] text-white">
        <Download className="size-5" aria-hidden />
      </span>

      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm font-medium">Εγκατάσταση Leavicy</p>
        {showIos ? (
          <p className="text-muted-foreground text-xs">
            Πατήστε{" "}
            <Share className="inline size-3.5 align-text-bottom" aria-hidden />{" "}
            και μετά «Προσθήκη στην οθόνη Αφετηρίας».
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">
            Προσθέστε την εφαρμογή στην οθόνη σας για γρήγορη, offline πρόσβαση.
          </p>
        )}

        {!showIos && (
          <Button
            id="install-app-button"
            data-cy="install-app-button"
            type="button"
            size="sm"
            onClick={install}
          >
            Εγκατάσταση
          </Button>
        )}
      </div>

      <Button
        id="dismiss-install-button"
        data-cy="dismiss-install-button"
        type="button"
        size="icon"
        variant="ghost"
        className="size-7 shrink-0"
        aria-label="Κλείσιμο"
        onClick={dismiss}
      >
        <X className="size-4" aria-hidden />
      </Button>
    </dialog>
  );
}
