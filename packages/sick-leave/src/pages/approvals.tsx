import { redirect } from "next/navigation";
import { requireActiveMembership } from "@repo/database/dal";
import { createClient } from "@repo/database/server";
import { formatDateRange, formatDateTime } from "@repo/database/format";
import { canReview } from "@repo/database/types";
import { PageHeader } from "@repo/ui";
import { ReviewControls } from "@repo/ui";
import { StatusBadge, TypeBadge } from "@repo/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui";

export const metadata = { title: "Approvals · Leavicy" };

type Row = {
  id: string;
  user_id: string;
  leave_type: "sick" | "injury" | "family_care" | "medical_appointment" | "other";
  start_date: string;
  end_date: string;
  working_days: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  reason: string | null;
  reviewed_at: string | null;
  profiles: { full_name: string | null; email: string | null } | null;
};

export default async function ApprovalsPage() {
  const { membership } = await requireActiveMembership();
  if (!canReview(membership.role)) redirect("/dashboard");

  const supabase = await createClient();

  const { data } = await supabase
    .from("leave_requests")
    .select(
      "id, user_id, leave_type, start_date, end_date, working_days, status, reason, reviewed_at, profiles(full_name, email)",
    )
    .eq("org_id", membership.org_id)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];
  const pending = rows.filter((r) => r.status === "pending");
  const reviewed = rows
    .filter((r) => r.status === "approved" || r.status === "rejected")
    .slice(0, 15);

  return (
    <>
      <PageHeader
        title="Approvals"
        description="Review and decide on your team's sick leave requests."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Pending ({pending.length})
          </CardTitle>
          <CardDescription>Requests awaiting your decision.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {pending.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              🎉 Nothing to review right now.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Decision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.profiles?.full_name ?? r.profiles?.email ?? "Unknown"}
                    </TableCell>
                    <TableCell>
                      <TypeBadge type={r.leave_type} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateRange(r.start_date, r.end_date)}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.working_days}
                    </TableCell>
                    <TableCell className="max-w-[16rem]">
                      <span className="text-sm text-muted-foreground">
                        {r.reason || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <ReviewControls id={r.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {reviewed.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Recently reviewed</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reviewed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewed.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.profiles?.full_name ?? r.profiles?.email ?? "Unknown"}
                    </TableCell>
                    <TableCell>
                      <TypeBadge type={r.leave_type} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateRange(r.start_date, r.end_date)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.reviewed_at ? formatDateTime(r.reviewed_at) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
