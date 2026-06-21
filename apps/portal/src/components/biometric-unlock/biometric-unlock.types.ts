export type BiometricUnlockProps = {
  /** Stable id forwarded to the root element. */
  id: string;
  /** Internal path to return to after a successful unlock. */
  redirectedFrom: string;
};
