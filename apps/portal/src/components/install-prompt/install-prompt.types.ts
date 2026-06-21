export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallPromptProps = {
  /** Stable id, forwarded to `data-cy` on the root element. */
  id: string;
};
