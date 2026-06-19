import { requireActiveMembership } from "@repo/database/dal";
import { createClient } from "@repo/database/server";
import { formatDateRange, todayISO } from "@repo/database/format";
import {
  LEAVE_TYPE_LABELS,
  LEAVE_STATUS_LABELS,
  type LeaveType,
  type LeaveStatus,
} from "@repo/database/types";
import { PageHeader } from "@repo/ui";
import { Badge } from "@repo/ui";
import {
  Avatar,
  AvatarFallback,
} from "@repo/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui";

export const metadata = { title: "Team calendar · SickDesk" };

type Entry = {
  id: string;
  user_id: string;
  full_name: string | null;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  status: LeaveStatus;
};

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function EntryRow({ e }: { e: Entry }) {
  return (
    <li className="flex items-center gap-3 rounded-md border p-3">
      <Avatar className="size-9">
        <AvatarFallback>{initials(e.full_name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{e.full_name}</p>
        <p className="text-xs text-muted-foreground">
          {formatDateRange(e.start_date, e.end_date)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <Badge variant="outline">{LEAVE_TYPE_LABELS[e.leave_type]}</Badge>
        {e.status === "pending" && (
          <span className="text-xs text-muted-foreground">
            {LEAVE_STATUS_LABELS[e.status]}
          </span>
        )}
      </div>
    </li>
  );
}

function Section({
  title,
  description,
  entries,
}: {
  title: string;
  description: string;
  entries: Entry[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {title} ({entries.length})
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing here.</p>
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => (
              <EntryRow key={e.id} e={e} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default async function CalendarPage() {
  const { membership } = await requireActiveMembership();
  const supabase = await createClient();
  const today = todayISO();

  const { data } = await supabase.rpc("get_team_calendar", {
    _org: membership.org_id,
  });
  const entries = (data ?? []) as Entry[];

  const current = entries.filter(
    (e) => e.start_date <= today && e.end_date >= today,
  );
  const upcoming = entries
    .filter((e) => e.start_date > today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  const past = entries
    .filter((e) => e.end_date < today)
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
    .slice(0, 20);

  return (
    <>
      <PageHeader
        title="Team calendar"
        description={`Who's on leave at ${membership.organization.name}. Reasons stay private.`}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Section
          title="Out now"
          description="On leave today"
          entries={current}
        />
        <Section
          title="Upcoming"
          description="Scheduled leave"
          entries={upcoming}
        />
        <Section
          title="Recent"
          description="Past leave"
          entries={past}
        />
      </div>
    </>
  );
}
