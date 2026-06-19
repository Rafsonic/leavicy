"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { Button } from "./button";
import { cancelLeaveRequest } from "@repo/database/actions/leave";

export function CancelRequestButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await cancelLeaveRequest(id);
            toast.success("Request cancelled.");
            router.refresh();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to cancel.");
          }
        })
      }
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
      Cancel
    </Button>
  );
}
