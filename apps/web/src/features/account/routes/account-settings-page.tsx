import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { accountEmailSchema, accountPasswordSchema } from "@salt/validation";

import { ApiClientError } from "../../../lib/api-client";
import { useAuthSessionQuery } from "../../auth/hooks/use-auth-session-query";
import { updateAccountEmail, updateAccountPassword } from "../api/account-client";

type EmailFormValues = z.infer<typeof accountEmailSchema>;
type PasswordFormValues = z.infer<typeof accountPasswordSchema>;

function SettingsCard({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-border bg-white/85 p-6 shadow-sm backdrop-blur">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function AccountSettingsPage() {
  const queryClient = useQueryClient();
  const sessionQuery = useAuthSessionQuery();
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(accountEmailSchema),
    defaultValues: {
      email: sessionQuery.data?.user.email ?? ""
    }
  });
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(accountPasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  useEffect(() => {
    if (sessionQuery.data?.user.email) {
      emailForm.reset({ email: sessionQuery.data.user.email });
    }
  }, [emailForm, sessionQuery.data?.user.email]);

  const emailMutation = useMutation({
    mutationFn: updateAccountEmail,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    }
  });

  const passwordMutation = useMutation({
    mutationFn: updateAccountPassword,
    onSuccess: () => {
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    }
  });

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border bg-white/85 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.4)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Account</p>
        <h2 className="mt-2 text-3xl font-semibold">Account settings</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Manage the current account credentials used to access the rebuilt SALT workspace.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <SettingsCard
          description="Update the login email used for future sign-ins."
          title="Email address"
        >
          <form
            className="space-y-4"
            onSubmit={emailForm.handleSubmit(async (values) => {
              await emailMutation.mutateAsync(values);
            })}
          >
            <label className="block space-y-2">
              <span className="text-sm font-medium">Email</span>
              <input
                className="w-full rounded-2xl border border-border bg-card px-4 py-3"
                type="email"
                {...emailForm.register("email")}
              />
            </label>

            {emailForm.formState.errors.email ? (
              <p className="text-sm text-red-700">{emailForm.formState.errors.email.message}</p>
            ) : null}

            {emailMutation.error instanceof ApiClientError ? (
              <p className="text-sm text-red-700">{emailMutation.error.message}</p>
            ) : null}

            {emailMutation.data ? (
              <p className="text-sm text-emerald-700">{emailMutation.data.message}</p>
            ) : null}

            <button
              className="rounded-2xl bg-primary px-4 py-3 font-medium text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
              disabled={emailMutation.isPending || sessionQuery.isLoading}
              type="submit"
            >
              {emailMutation.isPending ? "Saving…" : "Save email"}
            </button>
          </form>
        </SettingsCard>

        <SettingsCard
          description="Confirm the current password before replacing it with a new one."
          title="Password"
        >
          <form
            className="space-y-4"
            onSubmit={passwordForm.handleSubmit(async (values) => {
              await passwordMutation.mutateAsync(values);
            })}
          >
            <label className="block space-y-2">
              <span className="text-sm font-medium">Current password</span>
              <input
                className="w-full rounded-2xl border border-border bg-card px-4 py-3"
                type="password"
                {...passwordForm.register("currentPassword")}
              />
            </label>

            {passwordForm.formState.errors.currentPassword ? (
              <p className="text-sm text-red-700">
                {passwordForm.formState.errors.currentPassword.message}
              </p>
            ) : null}

            <label className="block space-y-2">
              <span className="text-sm font-medium">New password</span>
              <input
                className="w-full rounded-2xl border border-border bg-card px-4 py-3"
                type="password"
                {...passwordForm.register("newPassword")}
              />
            </label>

            {passwordForm.formState.errors.newPassword ? (
              <p className="text-sm text-red-700">
                {passwordForm.formState.errors.newPassword.message}
              </p>
            ) : null}

            <label className="block space-y-2">
              <span className="text-sm font-medium">Confirm new password</span>
              <input
                className="w-full rounded-2xl border border-border bg-card px-4 py-3"
                type="password"
                {...passwordForm.register("confirmPassword")}
              />
            </label>

            {passwordForm.formState.errors.confirmPassword ? (
              <p className="text-sm text-red-700">
                {passwordForm.formState.errors.confirmPassword.message}
              </p>
            ) : null}

            {passwordMutation.error instanceof ApiClientError ? (
              <p className="text-sm text-red-700">{passwordMutation.error.message}</p>
            ) : null}

            {passwordMutation.data ? (
              <p className="text-sm text-emerald-700">{passwordMutation.data.message}</p>
            ) : null}

            <button
              className="rounded-2xl bg-primary px-4 py-3 font-medium text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
              disabled={passwordMutation.isPending}
              type="submit"
            >
              {passwordMutation.isPending ? "Saving…" : "Save password"}
            </button>
          </form>
        </SettingsCard>
      </div>
    </div>
  );
}
