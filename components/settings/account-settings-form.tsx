"use client";

import { useFormState, useFormStatus } from "react-dom";

import {
  initialAccountActionState,
  updateOwnerEmailAction,
  updateOwnerPasswordAction
} from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton({ idleLabel, pendingLabel }: { idleLabel: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit">
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="text-sm text-danger">{errors[0]}</p>;
}

function FormMessage({
  status,
  message
}: {
  status: "idle" | "success" | "error";
  message?: string;
}) {
  if (!message || status === "idle") {
    return null;
  }

  return (
    <p className={`text-sm ${status === "success" ? "text-emerald-700" : "text-danger"}`}>
      {message}
    </p>
  );
}

export function AccountSettingsForm({ currentEmail }: { currentEmail: string }) {
  const [emailState, emailAction] = useFormState(
    updateOwnerEmailAction,
    initialAccountActionState
  );
  const [passwordState, passwordAction] = useFormState(
    updateOwnerPasswordAction,
    initialAccountActionState
  );

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Email address</CardTitle>
          <CardDescription>
            Update the owner login email used for future sign-ins.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={emailAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={currentEmail}
                required
              />
              <FieldError errors={emailState.fieldErrors?.email} />
            </div>
            <FormMessage status={emailState.status} message={emailState.message} />
            <SubmitButton idleLabel="Save email" pendingLabel="Saving..." />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Confirm the current password before replacing it with a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={passwordAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
              />
              <FieldError errors={passwordState.fieldErrors?.currentPassword} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
              />
              <FieldError errors={passwordState.fieldErrors?.newPassword} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
              />
              <FieldError errors={passwordState.fieldErrors?.confirmPassword} />
            </div>
            <FormMessage status={passwordState.status} message={passwordState.message} />
            <SubmitButton idleLabel="Save password" pendingLabel="Saving..." />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
