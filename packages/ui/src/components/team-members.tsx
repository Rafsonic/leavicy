"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import {
  updateMemberRole,
  removeMember,
  updateMemberAllowance,
} from "@repo/database/actions/team";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Input } from "./input";
import { Button } from "./button";
import {
  Avatar,
  AvatarFallback,
} from "./avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { ROLES, ROLE_LABELS, type AppRole } from "@repo/database/types";
import type { Member } from "./team-members.types";
import { initials } from "./team-members.utils";

export function TeamMembers({
  members,
  currentUserId,
}: {
  members: Member[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<void>, success: string) {
    startTransition(async () => {
      try {
        await fn();
        toast.success(success);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Action failed.");
      }
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="w-32">Allowance</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((m) => {
          const isSelf = m.userId === currentUserId;
          return (
            <TableRow key={m.membershipId}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarFallback>
                      {initials(m.fullName, m.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {m.fullName ?? "—"}
                      {isSelf && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          (you)
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.email}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Select
                  value={m.role}
                  disabled={pending || isSelf}
                  onValueChange={(v) =>
                    run(
                      () => updateMemberRole(m.membershipId, v as AppRole),
                      "Role updated.",
                    )
                  }
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min={0}
                  defaultValue={m.annualSickDays}
                  disabled={pending}
                  className="w-24"
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (v !== m.annualSickDays && v >= 0) {
                      run(
                        () => updateMemberAllowance(m.membershipId, v),
                        "Allowance updated.",
                      );
                    }
                  }}
                />
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending || isSelf}
                  onClick={() =>
                    run(
                      () => removeMember(m.membershipId),
                      "Member removed.",
                    )
                  }
                >
                  {pending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
