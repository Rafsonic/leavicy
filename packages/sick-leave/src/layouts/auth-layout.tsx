import { HeartPulse } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-1 flex-col items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-6 flex items-center justify-center gap-2 text-lg font-semibold"
        >
          <HeartPulse className="size-6 text-primary" />
          {process.env.NEXT_PUBLIC_APP_NAME ?? "SickDesk"}
        </Link>
        {children}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/privacy" className="underline">
            Privacy
          </Link>{" "}
          ·{" "}
          <Link href="/cookies" className="underline">
            Cookies
          </Link>
        </p>
      </div>
    </div>
  );
}
