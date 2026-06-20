import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  LoginForm,
} from "@repo/ui";
import { getCurrentUser, isPlatformAdmin } from "@repo/database/dal";

export const metadata = { title: "Sign in · Leavicy Central" };

export default async function CentralLoginPage() {
  // Only super-admins belong in Central. If already signed in as one, skip the
  // form; tenant users who are signed in stay here (no auto-redirect loop).
  const user = await getCurrentUser();
  if (user && (await isPlatformAdmin())) redirect("/dashboard");

  return (
    <Card data-component="CentralLoginPage" data-cy="central-login-page">
      <CardHeader>
        <CardTitle>Leavicy Central</CardTitle>
        <CardDescription>Sign in to the platform back-office.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm id="central-login-form" />
      </CardContent>
    </Card>
  );
}
