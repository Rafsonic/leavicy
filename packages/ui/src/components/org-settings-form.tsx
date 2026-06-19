"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  renameOrganization,
  type TeamActionState,
} from "@repo/database/actions/team";
import { Input } from "./input";
import { Label } from "./label";
import { SubmitButton } from "./submit-button";

export function OrgSettingsForm({ name }: { name: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState<TeamActionState, FormData>(
    renameOrganization,
    undefined,
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success("Company updated.");
      router.refresh();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="flex items-end gap-3">
      <div className="flex-1 space-y-2">
        <Label htmlFor="org-name">Company name</Label>
        <Input id="org-name" name="name" defaultValue={name} required />
      </div>
      <SubmitButton pendingText="Saving…">Save</SubmitButton>
    </form>
  );
}
