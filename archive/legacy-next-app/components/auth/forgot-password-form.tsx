"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordResetAction } from "@/server/actions";

const initialState = {
  status: "idle"
} as const;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit" className="w-full">
      {pending ? "Sending link..." : "Send reset link"}
    </Button>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useFormState(requestPasswordResetAction, initialState);

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter the email you use for SALT and we&apos;ll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
            {state.fieldErrors?.email ? (
              <p className="text-sm text-danger">{state.fieldErrors.email[0]}</p>
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
          <div className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium transition hover:text-foreground">
              Back to sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
