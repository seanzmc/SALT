import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import { z } from "zod";

import { resetPasswordSchema } from "@salt/validation";

import { ApiClientError } from "../../../lib/api-client";
import { resetPassword, validateResetToken } from "../api/auth-client";

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const tokenQuery = useQuery({
    queryKey: ["auth", "reset-token", token],
    queryFn: () => validateResetToken(token),
    enabled: Boolean(token),
    retry: false
  });

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      newPassword: "",
      confirmPassword: ""
    }
  });

  const resetMutation = useMutation({
    mutationFn: resetPassword
  });

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-[2rem] border border-border bg-white/90 p-8 shadow-[0_24px_70px_-32px_rgba(15,23,42,0.35)] backdrop-blur">
          <h1 className="text-2xl font-semibold">Reset link unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This reset link is invalid or missing. Request a new one to continue.
          </p>
          <div className="mt-6">
            <Link className="text-sm font-medium text-muted-foreground transition hover:text-foreground" to="/forgot-password">
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-[2rem] border border-border bg-white/90 p-8 shadow-[0_24px_70px_-32px_rgba(15,23,42,0.35)] backdrop-blur">
        {tokenQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Checking reset link…</p>
        ) : tokenQuery.data?.valid ? (
          <>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              SALT rebuild
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Create a new password</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose a new password for your SALT account. This reset link can only be used once.
            </p>

            <form
              className="mt-8 space-y-4"
              onSubmit={form.handleSubmit(async (values) => {
                await resetMutation.mutateAsync(values);
              })}
            >
              <input type="hidden" {...form.register("token")} />

              <label className="block space-y-2">
                <span className="text-sm font-medium">New password</span>
                <input
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3"
                  type="password"
                  {...form.register("newPassword")}
                />
              </label>

              {form.formState.errors.newPassword ? (
                <p className="text-sm text-red-700">{form.formState.errors.newPassword.message}</p>
              ) : null}

              <label className="block space-y-2">
                <span className="text-sm font-medium">Confirm new password</span>
                <input
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3"
                  type="password"
                  {...form.register("confirmPassword")}
                />
              </label>

              {form.formState.errors.confirmPassword ? (
                <p className="text-sm text-red-700">
                  {form.formState.errors.confirmPassword.message}
                </p>
              ) : null}

              {resetMutation.error instanceof ApiClientError ? (
                <p className="text-sm text-red-700">{resetMutation.error.message}</p>
              ) : null}

              {resetMutation.data ? (
                <p className="text-sm text-emerald-700">{resetMutation.data.message}</p>
              ) : null}

              <button
                className="w-full rounded-2xl bg-primary px-4 py-3 font-medium text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
                disabled={resetMutation.isPending}
                type="submit"
              >
                {resetMutation.isPending ? "Updating password…" : "Update password"}
              </button>
            </form>

            {resetMutation.data ? (
              <div className="mt-6 text-center text-sm text-muted-foreground">
                <Link className="font-medium transition hover:text-foreground" to="/login">
                  Return to sign in
                </Link>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">Reset link unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This reset link is invalid or has expired. Request a new one to continue.
            </p>
            <div className="mt-6">
              <Link className="text-sm font-medium text-muted-foreground transition hover:text-foreground" to="/forgot-password">
                Request a new reset link
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
