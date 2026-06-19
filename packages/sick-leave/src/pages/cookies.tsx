import Link from "next/link";
import { HeartPulse } from "lucide-react";

export const metadata = { title: "Cookie Policy · SickDesk" };

const APP = process.env.NEXT_PUBLIC_APP_NAME ?? "SickDesk";

export default function CookiesPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 font-semibold">
        <HeartPulse className="size-5 text-primary" />
        {APP}
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">Cookie Policy</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Last updated: 18 June 2026
      </p>

      <div className="mt-8 space-y-4 text-sm leading-6 text-foreground/80">
        <p>
          We use only <strong>strictly necessary</strong> cookies — no
          advertising or third-party tracking.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Authentication</strong> — Supabase session cookies
            (<code>sb-*-auth-token</code>) keep you signed in.
          </li>
          <li>
            <strong>Active company</strong> — a small <code>active_org</code>{" "}
            cookie remembers which workspace you&apos;re viewing.
          </li>
        </ul>
        <p>
          Because these cookies are essential to provide the service, they do not
          require consent. Clearing them signs you out.
        </p>
        <p className="pt-4 text-xs text-muted-foreground">
          See also our{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
