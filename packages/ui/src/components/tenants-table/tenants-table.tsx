"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, PauseCircle, PlayCircle, Archive } from "lucide-react";
import { setTenantStatus } from "@repo/database/actions/tenants";
import {
  ORG_STATUS_LABELS,
  ORG_STATUS_VARIANT,
  type OrgStatus,
  type TenantStats,
} from "@repo/database/types";
import { formatDate } from "@repo/database/format";
import { Button } from "../button";
import { Badge } from "../badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../table";
import { TenantFormDialog } from "../tenant-form-dialog/tenant-form-dialog";
import type { TenantsTableProps } from "./tenants-table.types";

export function TenantsTable({
  id,
  tenants,
}: TenantsTableProps): React.JSX.Element {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [editTarget, setEditTarget] = useState<TenantStats | null>(null);
  const [showArchived, setShowArchived] = useState<boolean>(false);

  const visible = tenants.filter(
    (t) => showArchived || t.status !== "archived",
  );

  function changeStatus(
    orgId: string,
    status: OrgStatus,
    success: string,
  ): void {
    startTransition(async () => {
      const res = await setTenantStatus(orgId, status);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(success);
      router.refresh();
    });
  }

  return (
    <div data-component="TenantsTable" data-cy={id} className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button
          id="toggle-archived-button"
          data-cy="toggle-archived-button"
          variant="outline"
          size="sm"
          onClick={() => setShowArchived((v) => !v)}
        >
          {showArchived ? "Hide archived" : "Show archived"}
        </Button>
        <Button
          id="create-tenant-button"
          data-cy="create-tenant-button"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-4" />
          Create tenant
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tenant</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Members</TableHead>
            <TableHead className="text-right">Requests</TableHead>
            <TableHead className="text-right">Pending</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-sm text-muted-foreground"
              >
                No tenants yet.
              </TableCell>
            </TableRow>
          ) : (
            visible.map((t) => (
              <TableRow key={t.org_id}>
                <TableCell>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.slug}</p>
                </TableCell>
                <TableCell>
                  <Badge variant={ORG_STATUS_VARIANT[t.status]}>
                    {ORG_STATUS_LABELS[t.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{t.member_count}</TableCell>
                <TableCell className="text-right">{t.request_count}</TableCell>
                <TableCell className="text-right">{t.pending_count}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(t.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      id={`edit-tenant-${t.slug}`}
                      data-cy={`edit-tenant-${t.slug}`}
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => setEditTarget(t)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    {t.status === "active" ? (
                      <Button
                        id={`suspend-tenant-${t.slug}`}
                        data-cy={`suspend-tenant-${t.slug}`}
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          changeStatus(t.org_id, "suspended", "Tenant suspended.")
                        }
                      >
                        <PauseCircle className="size-4" />
                      </Button>
                    ) : (
                      <Button
                        id={`activate-tenant-${t.slug}`}
                        data-cy={`activate-tenant-${t.slug}`}
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          changeStatus(t.org_id, "active", "Tenant activated.")
                        }
                      >
                        <PlayCircle className="size-4" />
                      </Button>
                    )}
                    {t.status !== "archived" && (
                      <Button
                        id={`archive-tenant-${t.slug}`}
                        data-cy={`archive-tenant-${t.slug}`}
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          changeStatus(t.org_id, "archived", "Tenant archived.")
                        }
                      >
                        <Archive className="size-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {createOpen && (
        <TenantFormDialog
          id="create-tenant-dialog"
          open
          onOpenChange={(o) => {
            if (!o) setCreateOpen(false);
          }}
        />
      )}
      {editTarget && (
        <TenantFormDialog
          id="edit-tenant-dialog"
          tenant={editTarget}
          open
          onOpenChange={(o) => {
            if (!o) setEditTarget(null);
          }}
        />
      )}
    </div>
  );
}
