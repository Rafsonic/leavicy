"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { createLeaveRequest } from "@repo/database/actions/leave";
import { workingDaysBetween, todayISO } from "@repo/database/format";
import { LEAVE_TYPES, LEAVE_TYPE_LABELS, type LeaveType } from "@repo/database/types";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Textarea } from "./textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

export function NewRequestDialog({
  closedDays = [],
}: {
  /** Company closed days (ISO `yyyy-mm-dd`) excluded from the working-day count. */
  closedDays?: string[];
} = {}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [leaveType, setLeaveType] = useState<LeaveType>("sick");
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [reason, setReason] = useState("");

  const days =
    startDate && endDate ? workingDaysBetween(startDate, endDate, closedDays) : 0;
  const closedSet = new Set(closedDays);
  const boundaryClosed =
    closedSet.has(startDate) || closedSet.has(endDate);

  function reset() {
    setLeaveType("sick");
    setStartDate(todayISO());
    setEndDate(todayISO());
    setReason("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const fd = new FormData();
      fd.set("leave_type", leaveType);
      fd.set("start_date", startDate);
      fd.set("end_date", endDate);
      fd.set("reason", reason);

      const res = await createLeaveRequest(undefined, fd);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Leave request submitted.");
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button id="new-request-button" data-cy="new-request-button">
            <Plus className="size-4" />
            New request
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New leave request</DialogTitle>
            <DialogDescription>
              Submit a sick leave request for approval.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={leaveType}
                onValueChange={(v) => setLeaveType(v as LeaveType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {LEAVE_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start_date">From</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate < e.target.value) setEndDate(e.target.value);
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">To</Label>
                <Input
                  id="end_date"
                  type="date"
                  min={startDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {days} working day{days === 1 ? "" : "s"}
              {boundaryClosed && " · selected dates include a company closed day"}
            </p>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Add a short note for your manager"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              id="submit-leave-request-button"
              data-cy="submit-leave-request-button"
              type="submit"
              disabled={pending || days < 1}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {pending ? "Submitting…" : "Submit request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
