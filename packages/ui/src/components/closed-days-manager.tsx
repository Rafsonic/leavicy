"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import {
  addClosedDay,
  removeClosedDay,
  type SettingsActionState,
} from "@repo/database/actions/settings";
import { formatDate } from "@repo/database/format";
import type { ClosedDay } from "@repo/database/types";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { SubmitButton } from "./submit-button";

export type ClosedDaysManagerProps = {
  /** Stable id, forwarded to `data-cy` on the root element. */
  id: string;
  /** Existing closed days for the active org, ascending by date. */
  closedDays: ClosedDay[];
};

export function ClosedDaysManager({
  id,
  closedDays,
}: ClosedDaysManagerProps): React.JSX.Element {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [state, formAction] = useActionState<SettingsActionState, FormData>(
    addClosedDay,
    undefined,
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success("Closed day added.");
      formRef.current?.reset();
      router.refresh();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  function remove(closedDayId: string): void {
    startTransition(async () => {
      try {
        await removeClosedDay(closedDayId);
        toast.success("Closed day removed.");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to remove.");
      }
    });
  }

  return (
    <div data-component="ClosedDaysManager" data-cy={id} className="space-y-4">
      <form
        ref={formRef}
        action={formAction}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="space-y-2">
          <Label htmlFor="closed-day-date">Date</Label>
          <Input id="closed-day-date" name="closed_date" type="date" required />
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="closed-day-name">Name</Label>
          <Input
            id="closed-day-name"
            name="name"
            placeholder="e.g. Christmas Day"
            required
          />
        </div>
        <SubmitButton
          id="add-closed-day-button"
          data-cy="add-closed-day-button"
          pendingText="Adding…"
        >
          Add closed day
        </SubmitButton>
      </form>

      {closedDays.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No closed days yet. Add public holidays or company shutdown dates so
          employees can&apos;t request leave on them.
        </p>
      ) : (
        <ul className="divide-y">
          {closedDays.map((day) => (
            <li
              key={day.id}
              className="flex items-center justify-between gap-2 py-3"
            >
              <div>
                <p className="text-sm font-medium">{day.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(day.closed_date)}
                </p>
              </div>
              <Button
                id={`remove-closed-day-${day.id}`}
                data-cy="remove-closed-day-button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => remove(day.id)}
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
