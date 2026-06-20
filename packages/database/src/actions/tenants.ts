"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../server";
import type { OrgStatus } from "../types";
import { requirePlatformAdminAction } from "./guards";

export type TenantActionState = { ok?: boolean; error?: string } | undefined;

const DUPLICATE_SLUG = "23505";

function revalidateTenants(): void {
  revalidatePath("/tenants");
  revalidatePath("/dashboard");
}

/** Create a tenant (platform admin only). */
export async function createTenant(
  _prev: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const guard = await requirePlatformAdminAction();
  if ("error" in guard) return { error: guard.error };

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!name) return { error: "Tenant name is required." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_create_tenant", {
    _name: name,
    _slug: slug || undefined,
  });

  if (error) {
    if (error.code === DUPLICATE_SLUG) {
      return { error: "That slug is already taken." };
    }
    return { error: error.message };
  }

  revalidateTenants();
  return { ok: true };
}

/** Update a tenant's name, slug and lifecycle status (platform admin only). */
export async function updateTenant(
  _prev: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const guard = await requirePlatformAdminAction();
  if ("error" in guard) return { error: guard.error };

  const orgId = String(formData.get("org_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const status = String(formData.get("status") ?? "") as OrgStatus;

  if (!orgId) return { error: "Missing tenant." };
  if (!name) return { error: "Tenant name is required." };
  if (!slug) return { error: "Tenant slug is required." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_tenant", {
    _org: orgId,
    _name: name,
    _slug: slug,
    _status: status,
  });

  if (error) {
    if (error.code === DUPLICATE_SLUG) {
      return { error: "That slug is already taken." };
    }
    return { error: error.message };
  }

  revalidateTenants();
  return { ok: true };
}

/**
 * Set a tenant's lifecycle status (suspend / archive / activate). Platform
 * admin only. Called directly from row actions (e.g. via `useTransition`).
 */
export async function setTenantStatus(
  orgId: string,
  status: OrgStatus,
): Promise<TenantActionState> {
  const guard = await requirePlatformAdminAction();
  if ("error" in guard) return { error: guard.error };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_tenant_status", {
    _org: orgId,
    _status: status,
  });

  if (error) return { error: error.message };

  revalidateTenants();
  return { ok: true };
}
