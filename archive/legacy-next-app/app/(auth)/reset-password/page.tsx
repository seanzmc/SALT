import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isPasswordResetTokenValid } from "@/lib/password-reset";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;
  const isValid = token ? await isPasswordResetTokenValid(token) : false;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      {token && isValid ? (
        <ResetPasswordForm token={token} />
      ) : (
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle>Reset link unavailable</CardTitle>
            <CardDescription>
              This reset link is invalid or has expired. Request a new one to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Request a new reset link
            </Link>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
