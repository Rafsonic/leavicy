import { z } from "zod";

/** Client-side validation schema for the signup form. */
export const signupSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required."),
  email: z.email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  consent: z.boolean().refine((v) => v === true, {
    message: "You must accept the Privacy & Cookie Policy.",
  }),
});

export type SignupValues = z.infer<typeof signupSchema>;
