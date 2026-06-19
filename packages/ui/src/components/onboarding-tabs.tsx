"use client";

import { useActionState } from "react";
import {
  createOrganization,
  acceptInvitation,
  type OnboardingState,
} from "@repo/database/actions/onboarding";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Input } from "./input";
import { Label } from "./label";
import { Alert, AlertDescription } from "./alert";
import { SubmitButton } from "./submit-button";
import { AlertCircle } from "lucide-react";

export function OnboardingTabs() {
  const [createState, createAction] = useActionState<OnboardingState, FormData>(
    createOrganization,
    undefined,
  );
  const [joinState, joinAction] = useActionState<OnboardingState, FormData>(
    acceptInvitation,
    undefined,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to SickDesk</CardTitle>
        <CardDescription>
          Create a company workspace, or join one you were invited to.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="create">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create company</TabsTrigger>
            <TabsTrigger value="join">Join with invite</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="pt-4">
            <form action={createAction} className="space-y-4">
              {createState?.error && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{createState.error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Company name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Acme Health"
                  required
                />
              </div>
              <SubmitButton className="w-full" pendingText="Creating…">
                Create company
              </SubmitButton>
            </form>
          </TabsContent>

          <TabsContent value="join" className="pt-4">
            <form action={joinAction} className="space-y-4">
              {joinState?.error && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{joinState.error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="token">Invitation token</Label>
                <Input
                  id="token"
                  name="token"
                  placeholder="Paste your invite token"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  You can also open the invite link your admin sent you.
                </p>
              </div>
              <SubmitButton className="w-full" pendingText="Joining…">
                Join company
              </SubmitButton>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
