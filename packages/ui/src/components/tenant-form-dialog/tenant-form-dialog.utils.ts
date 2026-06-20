import { z } from "zod";

/** Client-side validation schema for the tenant create/edit form. */
export const tenantSchema = z.object({
  name: z.string().min(1, "Tenant name is required."),
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, "Lowercase letters, numbers and hyphens only."),
  status: z.enum(["active", "suspended", "archived"]),
});

export type TenantFormValues = z.infer<typeof tenantSchema>;
