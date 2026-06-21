export type BiometricEnrollProps = {
  /** Stable id forwarded to the root element and (suffixed) to the button. */
  id: string;
  /** Trigger button label. Defaults to "Ενεργοποίηση Face ID". */
  label?: string;
  /** Called after a passkey is successfully enrolled. */
  onEnrolled?: () => void;
  className?: string;
};
