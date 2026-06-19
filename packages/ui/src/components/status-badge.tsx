import { Badge } from "./badge";
import {
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_VARIANT,
  type LeaveStatus,
} from "@repo/database/types";

export function StatusBadge({ status }: { status: LeaveStatus }) {
  return (
    <Badge variant={LEAVE_STATUS_VARIANT[status]}>
      {LEAVE_STATUS_LABELS[status]}
    </Badge>
  );
}
