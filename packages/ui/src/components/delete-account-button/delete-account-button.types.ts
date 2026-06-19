export type DeleteAccountButtonProps = {
  /** The user's email — must be typed to confirm deletion. */
  confirmEmail: string;
  /** Stable id used for both `id` and `data-cy`. */
  id?: string;
};
