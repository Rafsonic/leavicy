import { requireActiveMembership, getClosedDates } from "@repo/database/dal";
import { createClient } from "@repo/database/server";
import { formatDateRange, formatDate } from "@repo/database/format";
import { PageHeader } from "@repo/ui";
import { NewRequestDialog } from "@repo/ui";
import { CancelRequestButton } from "@repo/ui";
import { StatusBadge, TypeBadge } from "@repo/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";
import { Card, CardContent } from "@repo/ui";

export const metadata = { title: "My requests · Leavicy" };

export default async function RequestsPage() {
  const { user } = await requireActiveMembership();
  const supabase = await createClient();
  const closedDates = await getClosedDates();

  const { data: requests } = await supabase
    .from("leave_requests")
    .select(
      "id, leave_type, start_date, end_date, working_days, status, reason, review_note, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        title="My requests"
        description="Track and manage your sick leave requests."
        action={<NewRequestDialog closedDays={closedDates} />}
      />

      <Card>
        <CardContent className="p-0">
          {!requests || requests.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              You haven&apos;t submitted any requests yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <TypeBadge type={r.leave_type} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateRange(r.start_date, r.end_date)}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.working_days}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                      {r.status === "rejected" && r.review_note && (
                        <p className="mt-1 max-w-[16rem] text-xs text-muted-foreground">
                          {r.review_note}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "pending" ? (
                        <CancelRequestButton id={r.id} />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(r.created_at)}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
