import Link from "next/link";
import { CalendarCheck } from "lucide-react";

export const metadata = { title: "Privacy Policy · Leavicy" };

const APP = process.env.NEXT_PUBLIC_APP_NAME ?? "Leavicy";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="space-y-2 text-sm leading-6 text-foreground/80">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 font-semibold">
        <CalendarCheck className="size-5 text-primary" />
        {APP}
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Last updated: 18 June 2026
      </p>

      <div className="mt-8 space-y-6">
        <Section title="Who we are">
          <p>
            Leavicy provides sick-leave management for companies in Cyprus (EU).
            Your employer is the data controller; Leavicy acts as processor on
            their behalf.
          </p>
        </Section>

        <Section title="Data we process">
          <p>
            Account data (name, email), your organization membership and role,
            and leave records (dates, type, optional reason, status).
          </p>
        </Section>

        <Section title="Why we process it (legal basis)">
          <p>
            To provide the service (contract), to meet employment and
            social-security obligations, and — for account creation — your
            consent.
          </p>
        </Section>

        <Section title="Storage, security & location">
          <p>
            Data is stored in the <strong>EU</strong>. We apply row-level
            security (tenant isolation) and encryption in transit and at rest.
          </p>
        </Section>

        <Section title="Sub-processors">
          <p>
            Supabase (database, authentication, storage — EU) and Resend
            (invitation emails — EU). See our internal sub-processors register
            for details.
          </p>
        </Section>

        <Section title="Retention">
          <p>
            We keep data only as long as necessary. Cancelled/rejected requests
            are deleted 6 months after creation; free-text reasons are scrubbed
            after 24 months.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            You can access and export your data, correct it, and delete your
            account (erasure) from the{" "}
            <Link href="/account" className="text-foreground underline">
              Privacy &amp; data
            </Link>{" "}
            page. You may also object to or restrict processing, and lodge a
            complaint with the Cyprus Office of the Commissioner for Personal
            Data Protection.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            For privacy requests, contact your organization&apos;s administrator
            or the company&apos;s data protection contact.
          </p>
        </Section>

        <p className="pt-4 text-xs text-muted-foreground">
          See also our{" "}
          <Link href="/cookies" className="underline">
            Cookie Policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
