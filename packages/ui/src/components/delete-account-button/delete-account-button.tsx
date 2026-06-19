"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { deleteMyAccount } from "@repo/database/actions/account";
import { Button } from "../button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../dialog";
import { Input } from "../input";
import { Label } from "../label";
import type { DeleteAccountButtonProps } from "./delete-account-button.types";

export function DeleteAccountButton({
  confirmEmail,
  id = "delete-account-button",
}: DeleteAccountButtonProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();
  const canDelete = value.trim().toLowerCase() === confirmEmail.toLowerCase();

  function handleDelete(): void {
    startTransition(async () => {
      try {
        await deleteMyAccount();
        toast.success("Your account has been deleted.");
        window.location.assign("/login");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Deletion failed.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            id={id}
            data-cy={id}
            data-component="DeleteAccountButton"
            variant="destructive"
          >
            <Trash2 className="size-4" />
            Delete my account
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete your account</DialogTitle>
          <DialogDescription>
            This permanently deletes your account and all your data. This cannot
            be undone. Type <strong>{confirmEmail}</strong> to confirm.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="confirm-delete-email">Email</Label>
          <Input
            id="confirm-delete-email"
            data-cy="confirm-delete-email-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={confirmEmail}
          />
        </div>
        <DialogFooter>
          <Button
            id="confirm-delete-account-button"
            data-cy="confirm-delete-account-button"
            variant="destructive"
            disabled={!canDelete || pending}
            onClick={handleDelete}
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            Permanently delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
