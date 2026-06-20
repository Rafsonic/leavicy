"use client";

import { Button } from "@repo/ui";
import { WifiOff } from "lucide-react";

// Offline fallback served by the service worker when a navigation fails with no
// cached copy. Must stay self-contained (no data fetching) so it works offline.
export default function OfflinePage(): React.ReactElement {
  const handleRetry = (): void => {
    window.location.reload();
  };

  return (
    <main
      data-component="OfflinePage"
      className="flex min-h-svh flex-col items-center justify-center gap-6 p-8 text-center"
    >
      <span className="flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#5EEAD4] to-[#0E9488] text-white shadow-lg">
        <WifiOff className="size-9" aria-hidden />
      </span>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Είστε εκτός σύνδεσης
        </h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          Δεν υπάρχει σύνδεση στο διαδίκτυο. Ορισμένες σελίδες που έχετε ήδη
          επισκεφθεί παραμένουν διαθέσιμες. Επανασυνδεθείτε για να συνεχίσετε.
        </p>
      </div>

      <Button
        id="offline-retry-button"
        data-cy="offline-retry-button"
        type="button"
        onClick={handleRetry}
      >
        Δοκιμή ξανά
      </Button>
    </main>
  );
}
