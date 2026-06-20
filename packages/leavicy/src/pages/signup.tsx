import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui";
import { AuthForm } from "@repo/ui";
import { getCurrentUser } from "@repo/database/dal";

export const metadata = { title: "Sign up · Leavicy" };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Start managing sick leave for your team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AuthForm mode="signup" />
      </CardContent>
    </Card>
  );
}
