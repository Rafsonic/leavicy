// Pure environment checks for the install prompt. Kept component-local until a
// second module needs them (then promote to @repo/utils per the reuse rule).

/** True when the app is already running as an installed standalone PWA. */
export const isStandalone = (): boolean => {
  if (typeof window === "undefined") return false;
  const iosStandalone = (
    window.navigator as Navigator & { standalone?: boolean }
  ).standalone;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    iosStandalone === true
  );
};

/** True for iOS Safari, where install happens via the Share → Add to Home flow. */
export const isIos = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(window.navigator.userAgent) &&
    !("MSStream" in window)
  );
};
