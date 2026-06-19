"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Check, Trash2, Loader2 } from "lucide-react";
import { cancelInvitation } from "@repo/database/actions/team";
import { Button } from "./button";
import { Badge } from "./badge";
import { ROLE_LABELS } from "@repo/database/types";
import type { PendingInvite } from "./invitations-list.types";

export function InvitationsList({ invites }: { invites: PendingInvite[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);

  if (invites.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No pending invitations.</p>
    );
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    toast.success("Invite link copied.");
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <ul className="divide-y">
      {invites.map((inv) => (
        <li
          key={inv.id}
          className="flex flex-wrap items-center justify-between gap-2 py-3"
        >
          <div>
            <p className="text-sm font-medium">{inv.email}</p>
            <Badge variant="outline" className="mt-1">
              {ROLE_LABELS[inv.role]}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyLink(inv.token)}
            >
              {copied === inv.token ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              Copy link
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await cancelInvitation(inv.id);
                    toast.success("Invitation cancelled.");
                    router.refresh();
                  } catch (e) {
                    toast.error(
                      e instanceof Error ? e.message : "Failed to cancel.",
                    );
                  }
                })
              }
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
