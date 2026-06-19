import { Badge } from "./badge";
import { LEAVE_TYPE_LABELS, type LeaveType } from "@repo/database/types";

export function TypeBadge({ type }: { type: LeaveType }) {
  return <Badge variant="outline">{LEAVE_TYPE_LABELS[type]}</Badge>;
}
