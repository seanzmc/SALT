import { useEffect, useId, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type {
  AdminAssignmentUser,
  AdminCreateUserInput,
  AdminResetTarget,
  AdminSetupSubtask,
  AdminUserRecord,
  UserRole
} from "@salt/types";

import { ApiClientError } from "../../../lib/api-client";
import {
  WorkspacePageHeader,
  WorkspaceSurface
} from "../../../app/components/workspace-page";
import { useToast } from "../../../app/providers/toast-provider";
import { useAuthSessionQuery } from "../../auth/hooks/use-auth-session-query";
import {
  createAdminUser,
  deactivateAdminUser,
  getAdminSetupData,
  reactivateAdminUser,
  resetAdminStatuses,
  updateAdminSubtaskSetup,
  updateAdminUser
} from "../api/admin-client";
import { adminQueryKeys } from "../lib/query-keys";

function toDateValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

async function invalidateOperationalQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.setup }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    queryClient.invalidateQueries({ queryKey: ["tasks"] }),
    queryClient.invalidateQueries({ queryKey: ["documents"] }),
    queryClient.invalidateQueries({ queryKey: ["messages"] }),
    queryClient.invalidateQueries({ queryKey: ["budget"] }),
    queryClient.invalidateQueries({ queryKey: ["timeline"] }),
    queryClient.invalidateQueries({ queryKey: ["auth", "session"] })
  ]);
}

function SectionCard({
  title,
  description,
  collapsible = false,
  defaultOpen = true,
  children
}: {
  title: string;
  description: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className="rounded-[1.5rem] border border-border/80 bg-white/78 shadow-[0_20px_50px_-42px_rgba(15,23,42,0.35)] backdrop-blur">
      <div className="flex items-start justify-between gap-4 px-5 py-5">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {collapsible ? (
          <button
            aria-controls={panelId}
            aria-expanded={open}
            className="rounded-full border border-border bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:bg-muted"
            onClick={() => setOpen((current) => !current)}
            type="button"
          >
            {open ? "Collapse" : "Expand"}
          </button>
        ) : null}
      </div>
      {!collapsible || open ? (
        <div className="border-t border-border/70 px-5 py-5" id={panelId}>
          {children}
        </div>
      ) : null}
    </section>
  );
}

function Notice({
  tone,
  message
}: {
  tone: "error" | "success";
  message?: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <p className={`text-sm ${tone === "error" ? "text-red-700" : "text-emerald-700"}`}>
      {message}
    </p>
  );
}

function SummaryTile({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.15rem] border border-border/75 bg-[rgba(232,244,241,0.68)] px-4 py-4 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.35)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

function ResetStatusCard({
  target,
  title,
  description,
  onRun
}: {
  target: AdminResetTarget;
  title: string;
  description: string;
  onRun: (target: AdminResetTarget) => Promise<void>;
}) {
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const mutation = useMutation({
    mutationFn: resetAdminStatuses,
    onSuccess: (result) => {
      setError(undefined);
      setMessage(result.message);
    },
    onError: (mutationError) => {
      setMessage(undefined);
      setError(
        mutationError instanceof ApiClientError
          ? mutationError.message
          : "Unable to run reset."
      );
    }
  });

  return (
    <div className="rounded-xl border border-border p-4">
      <h4 className="font-medium">{title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 space-y-2">
        <Notice message={message} tone="success" />
        <Notice message={error} tone="error" />
        <button
          className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
          disabled={mutation.isPending}
          onClick={async () => {
            await mutation.mutateAsync({ target });
            await onRun(target);
          }}
          type="button"
        >
          {mutation.isPending ? "Resetting…" : "Run reset"}
        </button>
      </div>
    </div>
  );
}

function CreateUserForm({
  onCreated
}: {
  onCreated: (user: AdminUserRecord) => Promise<void>;
}) {
  const [form, setForm] = useState<AdminCreateUserInput>({
    name: "",
    email: "",
    password: "",
    role: "COLLABORATOR"
  });
  const mutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess: async (user) => {
      setForm({
        name: "",
        email: "",
        password: "",
        role: "COLLABORATOR"
      });
      await onCreated(user);
    }
  });

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        await mutation.mutateAsync(form);
      }}
    >
      <label className="space-y-2">
        <span className="text-sm font-medium">Name</span>
        <input
          className="w-full rounded-2xl border border-border bg-card px-4 py-3"
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          value={form.name}
        />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Email</span>
        <input
          className="w-full rounded-2xl border border-border bg-card px-4 py-3"
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          type="email"
          value={form.email}
        />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Password</span>
        <input
          className="w-full rounded-2xl border border-border bg-card px-4 py-3"
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          type="password"
          value={form.password}
        />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Role</span>
        <select
          className="w-full rounded-2xl border border-border bg-card px-4 py-3"
          onChange={(event) =>
            setForm((current) => ({ ...current, role: event.target.value as UserRole }))
          }
          value={form.role}
        >
          <option value="COLLABORATOR">Collaborator</option>
          <option value="OWNER_ADMIN">Owner Admin</option>
        </select>
      </label>
      <div className="md:col-span-2 space-y-2">
        {mutation.error instanceof ApiClientError ? (
          <Notice message={mutation.error.message} tone="error" />
        ) : null}
        {mutation.data ? <Notice message="User account created." tone="success" /> : null}
        <button
          className="rounded-2xl bg-primary px-4 py-3 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-70"
          disabled={mutation.isPending}
          type="submit"
        >
          {mutation.isPending ? "Creating…" : "Create user"}
        </button>
      </div>
    </form>
  );
}

function UserRowForm({
  currentUserId,
  onSaved,
  user
}: {
  currentUserId: string;
  onSaved: (user: AdminUserRecord) => Promise<void>;
  user: AdminUserRecord;
}) {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    password: ""
  });

  useEffect(() => {
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      password: ""
    });
  }, [user.email, user.name, user.role]);

  const mutation = useMutation({
    mutationFn: updateAdminUser
  });

  return (
    <form
      className="rounded-xl border border-border p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const updatedUser = await mutation.mutateAsync({
          userId: user.id,
          name: form.name,
          email: form.email,
          password: form.password || null,
          role: form.role
        });
        await onSaved(updatedUser);
      }}
    >
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.2fr_0.8fr_1fr_auto]">
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Name</span>
          <input
            className="w-full rounded-2xl border border-border bg-card px-4 py-3"
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            value={form.name}
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Email</span>
          <input
            className="w-full rounded-2xl border border-border bg-card px-4 py-3"
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            type="email"
            value={form.email}
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Role</span>
          <select
            className="w-full rounded-2xl border border-border bg-card px-4 py-3"
            onChange={(event) =>
              setForm((current) => ({ ...current, role: event.target.value as UserRole }))
            }
            value={form.role}
          >
            <option value="COLLABORATOR">Collaborator</option>
            <option value="OWNER_ADMIN">Owner Admin</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Password
          </span>
          <input
            className="w-full rounded-2xl border border-border bg-card px-4 py-3"
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            placeholder="Leave blank to keep"
            type="password"
            value={form.password}
          />
        </label>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Action</p>
          <button
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70"
            disabled={mutation.isPending}
            type="submit"
          >
            {mutation.isPending ? "Saving…" : "Save"}
          </button>
          <p className="text-xs text-muted-foreground">
            {user.openTaskCount} open tasks • {user.openSubtaskCount} open checklist items
          </p>
          {user.id === currentUserId ? (
            <p className="text-xs text-muted-foreground">Signed-in owner</p>
          ) : !user.isActive ? (
            <p className="text-xs text-muted-foreground">Inactive user</p>
          ) : null}
        </div>
      </div>
      <div className="mt-3">
        {mutation.error instanceof ApiClientError ? (
          <Notice message={mutation.error.message} tone="error" />
        ) : null}
      </div>
    </form>
  );
}

function DeactivateUserForm({
  currentUserId,
  replacementUsers,
  user,
  onDeactivated
}: {
  currentUserId: string;
  replacementUsers: AdminAssignmentUser[];
  user: AdminUserRecord;
  onDeactivated: () => Promise<void>;
}) {
  const [replacementUserId, setReplacementUserId] = useState("");
  const [transferTasks, setTransferTasks] = useState(user.openTaskCount > 0);
  const [transferSubtasks, setTransferSubtasks] = useState(user.openSubtaskCount > 0);
  const mutation = useMutation({
    mutationFn: deactivateAdminUser,
    onSuccess: async () => {
      await onDeactivated();
    }
  });

  if (!user.isActive || user.id === currentUserId) {
    return null;
  }

  return (
    <form
      className="rounded-xl border border-border p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        await mutation.mutateAsync({
          userId: user.id,
          replacementUserId: replacementUserId || null,
          transferTasks,
          transferSubtasks
        });
      }}
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1.1fr_auto_auto_auto]">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Deactivate user</p>
          <div className="font-medium">{user.name}</div>
          <p className="text-xs text-muted-foreground">
            {user.role === "OWNER_ADMIN" ? "Owner Admin" : "Collaborator"} • {user.openTaskCount} open tasks • {user.openSubtaskCount} open checklist items
          </p>
        </div>
        <label className="space-y-2">
          <span className="text-sm font-medium">Replacement owner</span>
          <select
            className="w-full rounded-2xl border border-border bg-card px-4 py-3"
            onChange={(event) => setReplacementUserId(event.target.value)}
            value={replacementUserId}
          >
            <option value="">Keep current assignees</option>
            {replacementUsers
              .filter((replacementUser) => replacementUser.id !== user.id)
              .map((replacementUser) => (
                <option key={replacementUser.id} value={replacementUser.id}>
                  {replacementUser.name} ({replacementUser.role === "OWNER_ADMIN" ? "Owner" : "Collaborator"})
                </option>
              ))}
          </select>
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Open tasks</span>
          <span className="flex items-center gap-2">
            <input
              checked={transferTasks}
              onChange={(event) => setTransferTasks(event.target.checked)}
              type="checkbox"
            />
            Transfer open tasks
          </span>
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Checklist items</span>
          <span className="flex items-center gap-2">
            <input
              checked={transferSubtasks}
              onChange={(event) => setTransferSubtasks(event.target.checked)}
              type="checkbox"
            />
            Transfer open items
          </span>
        </label>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Action</p>
          <button
            className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
            disabled={mutation.isPending}
            type="submit"
          >
            {mutation.isPending ? "Deactivating…" : "Deactivate"}
          </button>
        </div>
      </div>
      <div className="mt-3">
        {mutation.error instanceof ApiClientError ? (
          <Notice message={mutation.error.message} tone="error" />
        ) : mutation.data ? (
          <Notice message={mutation.data.message} tone="success" />
        ) : null}
      </div>
    </form>
  );
}

function ReactivateUserForm({
  user,
  onReactivated
}: {
  user: AdminUserRecord;
  onReactivated: () => Promise<void>;
}) {
  const mutation = useMutation({
    mutationFn: reactivateAdminUser,
    onSuccess: async () => {
      await onReactivated();
    }
  });

  if (user.isActive) {
    return null;
  }

  return (
    <form
      className="rounded-xl border border-border p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        await mutation.mutateAsync({ userId: user.id });
      }}
    >
      <div className="grid gap-4 lg:grid-cols-[1.6fr_auto]">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Reactivate user</p>
          <div className="font-medium">{user.name}</div>
          <p className="text-xs text-muted-foreground">
            {user.role === "OWNER_ADMIN" ? "Owner Admin" : "Collaborator"} • Restores sign-in access and active assignment eligibility.
          </p>
          <p className="text-xs text-muted-foreground">
            Historical assignments stay intact. Current open work: {user.openTaskCount} tasks • {user.openSubtaskCount} checklist items
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Action</p>
          <button
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70"
            disabled={mutation.isPending}
            type="submit"
          >
            {mutation.isPending ? "Reactivating…" : "Reactivate"}
          </button>
        </div>
      </div>
      <div className="mt-3">
        {mutation.error instanceof ApiClientError ? (
          <Notice message={mutation.error.message} tone="error" />
        ) : mutation.data ? (
          <Notice message={mutation.data.message} tone="success" />
        ) : null}
      </div>
    </form>
  );
}

function SubtaskSetupRow({
  onSaved,
  subtask,
  users
}: {
  onSaved: (subtask: AdminSetupSubtask) => Promise<void>;
  subtask: AdminSetupSubtask;
  users: AdminAssignmentUser[];
}) {
  const [dueDate, setDueDate] = useState(toDateValue(subtask.dueDate));
  const [assignedToId, setAssignedToId] = useState(subtask.assignedToId ?? "");
  const mutation = useMutation({
    mutationFn: updateAdminSubtaskSetup
  });

  useEffect(() => {
    setDueDate(toDateValue(subtask.dueDate));
    setAssignedToId(subtask.assignedToId ?? "");
  }, [subtask.assignedToId, subtask.dueDate]);

  return (
    <form
      className="rounded-xl border border-border p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const updatedSubtask = await mutation.mutateAsync({
          subtaskId: subtask.id,
          dueDate: dueDate || null,
          assignedToId: assignedToId || null
        });
        await onSaved(updatedSubtask);
      }}
    >
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.7fr_0.9fr_1fr_auto]">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Checklist item</p>
          <div className="font-medium">{subtask.title}</div>
          <div className="text-xs text-muted-foreground">{subtask.task.title}</div>
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Status</p>
          <p>{subtask.isComplete ? "Complete" : "Pending"}</p>
        </div>
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Due date</span>
          <input
            className="w-full rounded-2xl border border-border bg-card px-4 py-3"
            onChange={(event) => setDueDate(event.target.value)}
            type="date"
            value={dueDate}
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Assigned to</span>
          <select
            className="w-full rounded-2xl border border-border bg-card px-4 py-3"
            onChange={(event) => setAssignedToId(event.target.value)}
            value={assignedToId}
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role === "OWNER_ADMIN" ? "Owner" : "Collaborator"})
              </option>
            ))}
          </select>
        </label>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Action</p>
          <button
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70"
            disabled={mutation.isPending}
            type="submit"
          >
            {mutation.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      <div className="mt-3">
        {mutation.error instanceof ApiClientError ? (
          <Notice message={mutation.error.message} tone="error" />
        ) : null}
      </div>
    </form>
  );
}

export function AdminSetupPage() {
  const queryClient = useQueryClient();
  const sessionQuery = useAuthSessionQuery();
  const toast = useToast();
  const adminQuery = useQuery({
    queryKey: adminQueryKeys.setup,
    queryFn: getAdminSetupData
  });

  const setupData = adminQuery.data;
  const currentUserId = sessionQuery.data?.user.id ?? "";
  const activeAssignmentUsers = setupData?.activeAssignmentUsers ?? [];

  const sortedUsers = useMemo(() => setupData?.users ?? [], [setupData?.users]);

  async function refreshAdminAfterMutation() {
    await invalidateOperationalQueries(queryClient);
  }

  return (
    <div className="space-y-6">
      <WorkspacePageHeader
        description="Owner-only workspace for user lifecycle, setup context, and operational safeguards. High-frequency task editing now lives in the task workflow, so this page focuses on exceptions and administration."
        eyebrow="Setup"
        title="Operational setup workspace"
      />

      {adminQuery.isLoading ? (
        <WorkspaceSurface bodyClassName="text-sm text-muted-foreground" title="Owner controls">
          Loading setup workspace...
        </WorkspaceSurface>
      ) : adminQuery.error instanceof ApiClientError ? (
        <WorkspaceSurface bodyClassName="p-0" title="Owner controls">
          <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
            {adminQuery.error.message}
          </div>
        </WorkspaceSurface>
      ) : setupData ? (
        <WorkspaceSurface
          bodyClassName="space-y-5"
          description="Collapse lower-frequency controls until you need them. User management stays prominent, checklist overrides stay available, and destructive resets are isolated at the bottom."
          title="Owner controls"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryTile
              detail="Visible in this owner workspace"
              label="Users"
              value={String(setupData.users.length)}
            />
            <SummaryTile
              detail="Can receive assignments"
              label="Active assignees"
              value={String(activeAssignmentUsers.length)}
            />
            <SummaryTile
              detail="Now edited in the task workflow"
              label="Tasks"
              value={String(setupData.tasks.length)}
            />
            <SummaryTile
              detail="Owner-only override area"
              label="Checklist overrides"
              value={String(setupData.subtasks.length)}
            />
          </div>

          <div className="rounded-[1.25rem] border border-border/75 bg-[rgba(255,251,244,0.76)] px-5 py-4 text-sm leading-6 text-muted-foreground shadow-[0_18px_50px_-42px_rgba(15,23,42,0.35)]">
            Direct task assignment and due-date setup were removed from this page because those
            edits are clearer inside the task workflow itself. This setup surface remains for
            owner-only overrides, user lifecycle work, and operational resets.
          </div>

          <SectionCard
            description="Keep primary owner admin work in one place: add accounts first, then update existing users without leaving the section."
            title="User access"
          >
            <div className="space-y-5">
              <div className="space-y-4 rounded-[1.15rem] border border-border/70 bg-muted/18 p-4">
                <div>
                  <p className="font-medium text-foreground">Create user</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add owner or collaborator accounts using the current credentials flow.
                  </p>
                </div>
                <CreateUserForm
                  onCreated={async () => {
                    await refreshAdminAfterMutation();
                    toast.success("User created");
                  }}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <p className="font-medium text-foreground">Existing users</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Update names, emails, roles, and passwords without editing the database
                    directly.
                  </p>
                </div>

                {sortedUsers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/35 p-4 text-sm text-muted-foreground">
                    No users are available yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedUsers.map((user) => (
                      <UserRowForm
                        currentUserId={currentUserId}
                        key={user.id}
                        onSaved={async (updatedUser) => {
                          await refreshAdminAfterMutation();
                          toast.success("User updated", updatedUser.name);
                        }}
                        user={user}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            collapsible
            description="Deactivate users without deleting them, or reactivate former users when they need access again."
            defaultOpen={false}
            title="User lifecycle"
          >
            <div className="space-y-4">
              {sortedUsers.some((user) => user.isActive && user.id !== currentUserId) ? (
                sortedUsers.map((user) => (
                  <DeactivateUserForm
                    currentUserId={currentUserId}
                    key={user.id}
                    onDeactivated={async () => {
                      await refreshAdminAfterMutation();
                      toast.success("User deactivated", user.name);
                    }}
                    replacementUsers={activeAssignmentUsers}
                    user={user}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No additional active users are available for deactivation.
                </p>
              )}

              {sortedUsers.some((user) => !user.isActive) ? (
                sortedUsers.map((user) => (
                  <ReactivateUserForm
                    key={`reactivate-${user.id}`}
                    onReactivated={async () => {
                      await refreshAdminAfterMutation();
                      toast.success("User reactivated", user.name);
                    }}
                    user={user}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No inactive users are waiting for reactivation.
                </p>
              )}
            </div>
          </SectionCard>

          <SectionCard
            collapsible
            description="Checklist items support direct assignment and due dates for operational handoff."
            defaultOpen={false}
            title="Checklist item overrides"
          >
            {setupData.subtasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/35 p-4 text-sm text-muted-foreground">
                No active checklist items are available for setup.
              </div>
            ) : (
              <div className="space-y-4">
                {setupData.subtasks.map((subtask) => (
                  <SubtaskSetupRow
                    key={subtask.id}
                    onSaved={async (updatedSubtask) => {
                      await refreshAdminAfterMutation();
                      toast.success("Checklist item setup saved", updatedSubtask.title);
                    }}
                    subtask={subtask}
                    users={activeAssignmentUsers}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            collapsible
            description="Clear seeded completion state before handing the workspace to a live team."
            defaultOpen={false}
            title="Operational resets"
          >
            <div className="grid gap-4 xl:grid-cols-3">
              <ResetStatusCard
                description="Sets every task back to NOT_STARTED and clears completed and blocked fields."
                onRun={async (target) => {
                  await refreshAdminAfterMutation();
                  toast.success(
                    "Operational reset complete",
                    target === "all"
                      ? "Tasks and checklist items were reset."
                      : target === "tasks"
                        ? "Task statuses were reset."
                        : "Checklist item statuses were reset."
                  );
                }}
                target="tasks"
                title="Reset task statuses"
              />
              <ResetStatusCard
                description="Marks every checklist item as pending while preserving titles, dates, and assignments."
                onRun={async (target) => {
                  await refreshAdminAfterMutation();
                  toast.success(
                    "Operational reset complete",
                    target === "all"
                      ? "Tasks and checklist items were reset."
                      : target === "tasks"
                        ? "Task statuses were reset."
                        : "Checklist item statuses were reset."
                  );
                }}
                target="subtasks"
                title="Reset checklist items"
              />
              <ResetStatusCard
                description="Runs both resets together for a clean operational baseline."
                onRun={async (target) => {
                  await refreshAdminAfterMutation();
                  toast.success(
                    "Operational reset complete",
                    target === "all"
                      ? "Tasks and checklist items were reset."
                      : target === "tasks"
                        ? "Task statuses were reset."
                        : "Checklist item statuses were reset."
                  );
                }}
                target="all"
                title="Reset both"
              />
            </div>
          </SectionCard>
        </WorkspaceSurface>
      ) : null}
    </div>
  );
}
