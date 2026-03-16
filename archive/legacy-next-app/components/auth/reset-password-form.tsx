"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction } from "@/server/actions";

const initialState = {
  status: "idle"
} as const;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit" className="w-full">
      {pending ? "Updating password..." : "Update password"}
    </Button>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useFormState(resetPasswordAction, initialState);

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader>
        <CardTitle>Create a new password</CardTitle>
        <CardDescription>
          Choose a new password for your SALT account. This reset link can only be used once.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
            />
            {state.fieldErrors?.newPassword ? (
              <p className="text-sm text-danger">{state.fieldErrors.newPassword[0]}</p>
            ) : null}
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
            {state.fieldErrors?.confirmPassword ? (
              <p className="text-sm text-danger">{state.fieldErrors.confirmPassword[0]}</p>
            ) : null}
          </div>
          {state.message ? (
            <p
              className={`text-sm ${
                state.status === "success" ? "text-emerald-700" : "text-danger"
              }`}
            >
              {state.message}
            </p>
          ) : null}
          <SubmitButton />
          {state.status === "success" ? (
            <div className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="font-medium transition hover:text-foreground">
                Return to sign in
              </Link>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
