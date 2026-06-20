import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui";
import { LoginForm } from "@repo/ui";
import { getCurrentUser } from "@repo/database/dal";

export const metadata = { title: "Sign in · Leavicy" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <Card data-component="LoginPage" data-cy="login-page">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your Leavicy account.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm id="login-form" />
      </CardContent>
    </Card>
  );
}
