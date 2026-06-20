"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { createTenant, updateTenant } from "@repo/database/actions/tenants";
import { ORG_STATUSES, ORG_STATUS_LABELS } from "@repo/database/types";
import { Button } from "../button";
import { Label } from "../label";
import { Alert, AlertDescription } from "../alert";
import { InputField } from "../input-field/input-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";
import { tenantSchema, type TenantFormValues } from "./tenant-form-dialog.utils";
import type { TenantFormDialogProps } from "./tenant-form-dialog.types";

export function TenantFormDialog({
  id,
  tenant,
  open,
  onOpenChange,
}: TenantFormDialogProps): React.JSX.Element {
  const router = useRouter();
  const isEdit = Boolean(tenant);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TenantFormValues>({
    resolver: standardSchemaResolver(tenantSchema),
    defaultValues: {
      name: tenant?.name ?? "",
      slug: tenant?.slug ?? "",
      status: tenant?.status ?? "active",
    },
  });

  const onSubmit = async (values: TenantFormValues): Promise<void> => {
    setServerError(null);
    const fd = new FormData();
    fd.set("name", values.name);
    fd.set("slug", values.slug);

    if (isEdit && tenant) {
      fd.set("org_id", tenant.org_id);
      fd.set("status", values.status);
      const res = await updateTenant(undefined, fd);
      if (res?.error) {
        setServerError(res.error);
        return;
      }
      toast.success("Tenant updated.");
    } else {
      const res = await createTenant(undefined, fd);
      if (res?.error) {
        setServerError(res.error);
        return;
      }
      toast.success("Tenant created.");
    }

    onOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-component="TenantFormDialog"
        data-cy={id}
        className="sm:max-w-md"
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit tenant" : "Create tenant"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update this tenant's details and lifecycle status."
                : "Add a new company to the platform."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {serverError && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <InputField
              id="tenant-name"
              label="Name"
              placeholder="Acme Health"
              registration={register("name")}
              error={errors.name}
            />

            <InputField
              id="tenant-slug"
              label={isEdit ? "Slug" : "Slug (optional)"}
              placeholder="acme-health"
              registration={register("slug")}
              error={errors.slug}
            />

            {isEdit && (
              <div className="space-y-2">
                <Label htmlFor="tenant-status">Status</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="tenant-status" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORG_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {ORG_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              id="save-tenant-button"
              data-cy="save-tenant-button"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isSubmitting
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Create tenant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
