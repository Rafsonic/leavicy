export type PwaRegisterProps = {
  /** Stable id, forwarded to `data-cy` on the root element. */
  id: string;
  /** Path to the service worker script. Defaults to `/sw.js`. */
  swUrl?: string;
};
