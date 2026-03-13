import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  accountEmailSchema,
  accountNameSchema,
  accountPasswordSchema
} from "@salt/validation";

import { ApiClientError } from "../../../lib/api-client";
import {
  WorkspacePageHeader,
  WorkspaceSurface
} from "../../../app/components/workspace-page";
import { useToast } from "../../../app/providers/toast-provider";
import { useAuthSessionQuery } from "../../auth/hooks/use-auth-session-query";
import {
  updateAccountEmail,
  updateAccountName,
  updateAccountPassword
} from "../api/account-client";

type NameFormValues = z.infer<typeof accountNameSchema>;
type EmailFormValues = z.infer<typeof accountEmailSchema>;
type PasswordFormValues = z.infer<typeof accountPasswordSchema>;

function SettingsPanel({
  title,
  description,
  defaultOpen = true,
  children
}: {
  title: string;
  description: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className="rounded-[1.25rem] border border-border/75 bg-white/72 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.35)]">
      <button
        aria-controls={panelId}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <span className="rounded-full border border-border bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {open ? "Expanded" : "Collapsed"}
        </span>
      </button>

      {open ? (
        <div className="border-t border-border/70 px-5 py-5" id={panelId}>
          {children}
        </div>
      ) : null}
    </section>
  );
}

export function AccountSettingsPage() {
  const queryClient = useQueryClient();
  const sessionQuery = useAuthSessionQuery();
  const toast = useToast();
  const sessionUser = sessionQuery.data?.user;
  const nameForm = useForm<NameFormValues>({
    resolver: zodResolver(accountNameSchema),
    defaultValues: {
      name: sessionUser?.name ?? ""
    }
  });
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(accountEmailSchema),
    defaultValues: {
      email: sessionUser?.email ?? ""
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
    if (sessionUser?.name) {
      nameForm.reset({ name: sessionUser.name });
    }

    if (sessionUser?.email) {
      emailForm.reset({ email: sessionUser.email });
    }
  }, [emailForm, nameForm, sessionUser?.email, sessionUser?.name]);

  async function refreshSession() {
    await queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
  }

  const nameMutation = useMutation({
    mutationFn: updateAccountName,
    onSuccess: async (result) => {
      await refreshSession();
      toast.success("Name updated", result.message);
    },
    onError: (error) => {
      toast.error(
        "Name update failed",
        error instanceof ApiClientError ? error.message : "Unable to update name."
      );
    }
  });

  const emailMutation = useMutation({
    mutationFn: updateAccountEmail,
    onSuccess: async (result) => {
      await refreshSession();
      toast.success("Email updated", result.message);
    },
    onError: (error) => {
      toast.error(
        "Email update failed",
        error instanceof ApiClientError ? error.message : "Unable to update email."
      );
    }
  });

  const passwordMutation = useMutation({
    mutationFn: updateAccountPassword,
    onSuccess: (result) => {
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      toast.success("Password updated", result.message);
    },
    onError: (error) => {
      toast.error(
        "Password update failed",
        error instanceof ApiClientError ? error.message : "Unable to update password."
      );
    }
  });

  return (
    <div className="space-y-6">
      <WorkspacePageHeader
        description="Keep your identity visible, update profile details cleanly, and move infrequent credential changes into lower account-specific controls."
        eyebrow="Account"
        title="Account settings"
      />

      <WorkspaceSurface
        bodyClassName="space-y-5"
        description="Identity stays visible at the top. Less-frequent sign-in controls sit lower so profile context remains clear."
        title="Account profile"
      >
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="rounded-[1.25rem] border border-border/75 bg-[rgba(232,244,241,0.68)] p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.35)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Visible identity context
            </p>
            <h3 className="mt-2 break-words text-2xl font-semibold text-foreground">
              {sessionUser?.name ?? "Loading account"}
            </h3>
            <p className="mt-2 break-words text-sm text-muted-foreground">{sessionUser?.email}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1rem] border border-border/70 bg-white/82 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Role
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {sessionUser?.role === "OWNER_ADMIN" ? "Owner admin" : "Collaborator"}
                </p>
              </div>
              <div className="rounded-[1rem] border border-border/70 bg-white/82 px-4 py-3 sm:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Access
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  Protected workspace account
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-border/75 bg-white/78 p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.35)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Primary profile edit
            </p>
            <form
              className="mt-4 space-y-4"
              onSubmit={nameForm.handleSubmit(async (values) => {
                await nameMutation.mutateAsync(values);
              })}
            >
              <label className="block space-y-2">
                <span className="text-sm font-medium">Name</span>
                <input
                  className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
                  {...nameForm.register("name")}
                />
              </label>

              {nameForm.formState.errors.name ? (
                <p className="text-sm text-red-700">{nameForm.formState.errors.name.message}</p>
              ) : null}
              {nameMutation.error instanceof ApiClientError ? (
                <p className="text-sm text-red-700">{nameMutation.error.message}</p>
              ) : null}
              {nameMutation.data ? (
                <p className="text-sm text-emerald-700">{nameMutation.data.message}</p>
              ) : null}

              <button
                className="rounded-[1rem] bg-primary px-4 py-3 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-70"
                disabled={nameMutation.isPending || sessionQuery.isLoading}
                type="submit"
              >
                {nameMutation.isPending ? "Saving..." : "Save name"}
              </button>
            </form>
          </div>
        </section>

        <section className="space-y-4 rounded-[1.25rem] border border-border/75 bg-white/72 p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.28)]">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Account options
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Credential changes live lower in the page because they are less frequent and should
              not compete with core account identity.
            </p>
          </div>

          <div className="space-y-4">
            <SettingsPanel
              defaultOpen
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
                    className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
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
                  className="rounded-[1rem] bg-primary px-4 py-3 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={emailMutation.isPending || sessionQuery.isLoading}
                  type="submit"
                >
                  {emailMutation.isPending ? "Saving..." : "Save email"}
                </button>
              </form>
            </SettingsPanel>

            <SettingsPanel
              defaultOpen={false}
              description="Confirm the current password before replacing it with a new one."
              title="Password"
            >
              <form
                className="space-y-4"
                onSubmit={passwordForm.handleSubmit(async (values) => {
                  await passwordMutation.mutateAsync(values);
                })}
              >
                <div className="grid gap-4 xl:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium">Current password</span>
                    <input
                      className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
                      type="password"
                      {...passwordForm.register("currentPassword")}
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium">New password</span>
                    <input
                      className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
                      type="password"
                      {...passwordForm.register("newPassword")}
                    />
                  </label>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-medium">Confirm new password</span>
                  <input
                    className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
                    type="password"
                    {...passwordForm.register("confirmPassword")}
                  />
                </label>

                {(["currentPassword", "newPassword", "confirmPassword"] as const).map((field) =>
                  passwordForm.formState.errors[field]?.message ? (
                    <p key={field} className="text-sm text-red-700">
                      {passwordForm.formState.errors[field]?.message}
                    </p>
                  ) : null
                )}

                {passwordMutation.error instanceof ApiClientError ? (
                  <p className="text-sm text-red-700">{passwordMutation.error.message}</p>
                ) : null}
                {passwordMutation.data ? (
                  <p className="text-sm text-emerald-700">{passwordMutation.data.message}</p>
                ) : null}

                <button
                  className="rounded-[1rem] bg-primary px-4 py-3 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={passwordMutation.isPending}
                  type="submit"
                >
                  {passwordMutation.isPending ? "Saving..." : "Save password"}
                </button>
              </form>
            </SettingsPanel>
          </div>
        </section>
      </WorkspaceSurface>
    </div>
  );
}
