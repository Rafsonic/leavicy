"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { cn } from "@repo/ui";
import type { OfflineIndicatorProps } from "./offline-indicator.types";

// Fixed banner shown while the browser reports no network connection, so the
// user understands why fresh data may be unavailable.
export function OfflineIndicator({
  id,
}: OfflineIndicatorProps): React.ReactElement | null {
  const [offline, setOffline] = useState<boolean>(false);

  useEffect(() => {
    const sync = (): void => setOffline(!navigator.onLine);
    // react-doctor-disable-next-line no-initialize-state -- intentional: navigator.onLine is browser-only and must be read after mount to avoid SSR hydration mismatch
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      data-component="OfflineIndicator"
      data-cy={id}
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-2",
        "bg-foreground/90 px-4 py-2 text-center text-sm font-medium text-background",
        "backdrop-blur supports-[backdrop-filter]:bg-foreground/80",
      )}
    >
      <WifiOff className="size-4 shrink-0" aria-hidden />
      <span>Εκτός σύνδεσης — εμφανίζονται αποθηκευμένα δεδομένα</span>
    </div>
  );
}
