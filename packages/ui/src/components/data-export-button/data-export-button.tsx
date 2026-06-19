"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { createClient } from "@repo/database/client";
import { Button } from "../button";
import type { DataExportButtonProps } from "./data-export-button.types";

export function DataExportButton({
  id = "export-my-data-button",
}: DataExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport(): Promise<void> {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("export_my_data");
      if (error) throw new Error(error.message);

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "leavicy-my-data.json";
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Your data has been downloaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      id={id}
      data-cy={id}
      data-component="DataExportButton"
      variant="outline"
      disabled={loading}
      onClick={handleExport}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      Download my data
    </Button>
  );
}
