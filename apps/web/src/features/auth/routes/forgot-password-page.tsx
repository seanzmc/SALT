import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";

import { forgotPasswordSchema } from "@salt/validation";

import { ApiClientError } from "../../../lib/api-client";
import { requestPasswordReset } from "../api/auth-client";

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ""
    }
  });

  const requestMutation = useMutation({
    mutationFn: requestPasswordReset
  });

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-[2rem] border border-border bg-white/90 p-8 shadow-[0_24px_70px_-32px_rgba(15,23,42,0.35)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          SALT rebuild
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Reset your password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the email you use for SALT and we&apos;ll send you a reset link.
        </p>

        <form
          className="mt-8 space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            await requestMutation.mutateAsync(values);
          })}
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium">Email</span>
            <input
              className="w-full rounded-2xl border border-border bg-card px-4 py-3"
              type="email"
              {...form.register("email")}
            />
          </label>

          {form.formState.errors.email ? (
            <p className="text-sm text-red-700">{form.formState.errors.email.message}</p>
          ) : null}

          {requestMutation.error instanceof ApiClientError ? (
            <p className="text-sm text-red-700">{requestMutation.error.message}</p>
          ) : null}

          {requestMutation.data ? (
            <p className="text-sm text-emerald-700">{requestMutation.data.message}</p>
          ) : null}

          <button
            className="w-full rounded-2xl bg-primary px-4 py-3 font-medium text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
            disabled={requestMutation.isPending}
            type="submit"
          >
            {requestMutation.isPending ? "Sending link…" : "Send reset link"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link className="font-medium transition hover:text-foreground" to="/login">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
