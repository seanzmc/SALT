import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type {
  AdminAssignmentUser,
  AdminCreateUserInput,
  AdminResetTarget,
  AdminSetupData,
  AdminSetupSubtask,
  AdminSetupTask,
  AdminUserRecord,
  UserRole
} from "@salt/types";

import { ApiClientError } from "../../../lib/api-client";
import { useAuthSessionQuery } from "../../auth/hooks/use-auth-session-query";
import {
  createAdminUser,
  deactivateAdminUser,
  getAdminSetupData,
  reactivateAdminUser,
  resetAdminStatuses,
  updateAdminSubtaskSetup,
  updateAdminTaskSetup,
  updateAdminUser
} from "../api/admin-client";
import { adminQueryKeys } from "../lib/query-keys";

function toDateValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function formatDate(value: string | null) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
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
    <SectionCard
      description="Add owner or collaborator accounts using the current credentials flow."
      title="Create user"
    >
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
    </SectionCard>
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

function TaskSetupRow({
  onSaved,
  task,
  users
}: {
  onSaved: (task: AdminSetupTask) => Promise<void>;
  task: AdminSetupTask;
  users: AdminAssignmentUser[];
}) {
  const [dueDate, setDueDate] = useState(toDateValue(task.dueDate));
  const [assignedToId, setAssignedToId] = useState(task.assignedToId ?? "");
  const mutation = useMutation({
    mutationFn: updateAdminTaskSetup
  });

  useEffect(() => {
    setDueDate(toDateValue(task.dueDate));
    setAssignedToId(task.assignedToId ?? "");
  }, [task.assignedToId, task.dueDate]);

  return (
    <form
      className="rounded-xl border border-border p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const updatedTask = await mutation.mutateAsync({
          taskId: task.id,
          dueDate: dueDate || null,
          assignedToId: assignedToId || null
        });
        await onSaved(updatedTask);
      }}
    >
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.7fr_0.9fr_1fr_auto]">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Task</p>
          <div className="font-medium">{task.title}</div>
          <div className="text-xs text-muted-foreground">{task.section.title}</div>
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Status</p>
          <p>{task.status.replaceAll("_", " ")}</p>
        </div>
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Due date</span>
          <input
            className="w-full rounded-2xl border border-border bg-card px-4 py-3"
            onChange={(event) => setDueDate(event.target.value)}
            type="date"
            value={dueDate}
          />
          <p className="text-xs text-muted-foreground">Current: {formatDate(task.dueDate)}</p>
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
      <section className="rounded-[2rem] border border-border bg-white/85 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.4)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Admin v2</p>
        <h2 className="mt-2 text-3xl font-semibold">Operational setup workspace</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Owner-only controls for resets, user lifecycle, assignments, and pre-launch setup on the rebuilt SALT stack.
        </p>
      </section>

      {adminQuery.isLoading ? (
        <section className="rounded-[1.75rem] border border-border bg-white/85 p-6 text-sm text-muted-foreground shadow-sm backdrop-blur">
          Loading setup workspace…
        </section>
      ) : adminQuery.error instanceof ApiClientError ? (
        <section className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {adminQuery.error.message}
        </section>
      ) : setupData ? (
        <>
          <SectionCard
            description="Clear seeded completion state before handing the workspace to a live team."
            title="Operational resets"
          >
            <div className="grid gap-4 xl:grid-cols-3">
              <ResetStatusCard
                description="Sets every task back to NOT_STARTED and clears completed and blocked fields."
                onRun={refreshAdminAfterMutation}
                target="tasks"
                title="Reset task statuses"
              />
              <ResetStatusCard
                description="Marks every checklist item as pending while preserving titles, dates, and assignments."
                onRun={refreshAdminAfterMutation}
                target="subtasks"
                title="Reset checklist items"
              />
              <ResetStatusCard
                description="Runs both resets together for a clean operational baseline."
                onRun={refreshAdminAfterMutation}
                target="all"
                title="Reset both"
              />
            </div>
          </SectionCard>

          <CreateUserForm
            onCreated={async () => {
              await refreshAdminAfterMutation();
            }}
          />

          <SectionCard
            description="Update names, emails, roles, and passwords without editing the database directly."
            title="Manage users"
          >
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
                    onSaved={async () => {
                      await refreshAdminAfterMutation();
                    }}
                    user={user}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            description="Deactivate users without deleting them, or reactivate former users when they need access again."
            title="User lifecycle"
          >
            <div className="space-y-4">
              {sortedUsers.some((user) => user.isActive && user.id !== currentUserId) ? (
                sortedUsers.map((user) => (
                  <DeactivateUserForm
                    currentUserId={currentUserId}
                    key={user.id}
                    onDeactivated={refreshAdminAfterMutation}
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
                    onReactivated={refreshAdminAfterMutation}
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
            description="Assign task owners and due dates in one place. Full task editing stays in the tasks workspace."
            title="Task setup"
          >
            {setupData.tasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/35 p-4 text-sm text-muted-foreground">
                No active tasks are available for setup.
              </div>
            ) : (
              <div className="space-y-4">
                {setupData.tasks.map((task) => (
                  <TaskSetupRow
                    key={task.id}
                    onSaved={async () => {
                      await refreshAdminAfterMutation();
                    }}
                    task={task}
                    users={activeAssignmentUsers}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            description="Checklist items support direct assignment and due dates for operational handoff."
            title="Checklist item setup"
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
                    onSaved={async () => {
                      await refreshAdminAfterMutation();
                    }}
                    subtask={subtask}
                    users={activeAssignmentUsers}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}
