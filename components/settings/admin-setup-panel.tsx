"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Role } from "@prisma/client";

import {
  createAdminUserAction,
  resetSetupStatusesAction,
  updateAdminUserAction,
  updateSubtaskSetupAction,
  updateTaskSetupAction
} from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const initialState: ActionState = {
  status: "idle"
};

function SubmitButton({
  idleLabel,
  pendingLabel,
  variant = "default"
}: {
  idleLabel: string;
  pendingLabel: string;
  variant?: "default" | "outline" | "danger";
}) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit" variant={variant}>
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

function FormMessage({ state }: { state: ActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  return (
    <p className={`text-sm ${state.status === "success" ? "text-emerald-700" : "text-danger"}`}>
      {state.message}
    </p>
  );
}

function toDateValue(value: Date | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function ResetStatusForm({
  target,
  title,
  description
}: {
  target: "tasks" | "subtasks" | "all";
  title: string;
  description: string;
}) {
  const [state, action] = useFormState(resetSetupStatusesAction, initialState);

  return (
    <form action={action} className="rounded-xl border border-border p-4">
      <input type="hidden" name="target" value={target} />
      <div className="space-y-2">
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        <FormMessage state={state} />
        <SubmitButton idleLabel="Run reset" pendingLabel="Resetting..." variant="danger" />
      </div>
    </form>
  );
}

function CreateUserForm() {
  const [state, action] = useFormState(createAdminUserAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create user</CardTitle>
        <CardDescription>
          Add owner or collaborator accounts using the current credentials flow.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="new-user-name">Name</Label>
            <Input id="new-user-name" name="name" required />
            <FieldError errors={state.fieldErrors?.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-user-email">Email</Label>
            <Input id="new-user-email" name="email" type="email" required />
            <FieldError errors={state.fieldErrors?.email} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-user-password">Password</Label>
            <Input id="new-user-password" name="password" type="password" required />
            <FieldError errors={state.fieldErrors?.password} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-user-role">Role</Label>
            <Select defaultValue={Role.COLLABORATOR} id="new-user-role" name="role">
              <option value={Role.COLLABORATOR}>Collaborator</option>
              <option value={Role.OWNER_ADMIN}>Owner Admin</option>
            </Select>
            <FieldError errors={state.fieldErrors?.role} />
          </div>
          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <SubmitButton idleLabel="Create user" pendingLabel="Creating..." />
            <FormMessage state={state} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function UserRowForm({
  user,
  isCurrentOwner
}: {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  isCurrentOwner: boolean;
}) {
  const [state, action] = useFormState(updateAdminUserAction, initialState);

  return (
    <form action={action} className="rounded-xl border border-border p-4">
      <input type="hidden" name="userId" value={user.id} />
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.2fr_0.8fr_1fr_auto]">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Name</p>
          <div className="space-y-2">
            <Input aria-label={`Name for ${user.name}`} defaultValue={user.name} name="name" />
            <FieldError errors={state.fieldErrors?.name} />
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Email</p>
          <div className="space-y-2">
            <Input
              aria-label={`Email for ${user.name}`}
              defaultValue={user.email}
              name="email"
              type="email"
            />
            <FieldError errors={state.fieldErrors?.email} />
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Role</p>
          <div className="space-y-2">
            <Select aria-label={`Role for ${user.name}`} defaultValue={user.role} name="role">
              <option value={Role.COLLABORATOR}>Collaborator</option>
              <option value={Role.OWNER_ADMIN}>Owner Admin</option>
            </Select>
            <FieldError errors={state.fieldErrors?.role} />
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Password</p>
          <div className="space-y-2">
            <Input
              aria-label={`Password for ${user.name}`}
              name="password"
              placeholder="Leave blank to keep"
              type="password"
            />
            <FieldError errors={state.fieldErrors?.password} />
          </div>
        </div>
        <div className="space-y-2">
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Action</p>
          <div className="flex flex-col items-start gap-2">
            <SubmitButton idleLabel="Save" pendingLabel="Saving..." variant="outline" />
            {isCurrentOwner ? (
              <span className="text-xs text-muted-foreground">Signed-in owner</span>
            ) : null}
          </div>
          <FormMessage state={state} />
        </div>
      </div>
    </form>
  );
}

function TaskSetupRow({
  task,
  users
}: {
  task: {
    id: string;
    title: string;
    dueDate: Date | null;
    status: string;
    section: { title: string };
    assignedToId: string | null;
    assignedTo: { name: string } | null;
  };
  users: Array<{ id: string; name: string; role: Role }>;
}) {
  const [state, action] = useFormState(updateTaskSetupAction, initialState);

  return (
    <form action={action} className="rounded-xl border border-border p-4">
      <input type="hidden" name="taskId" value={task.id} />
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
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Due date</p>
          <div className="space-y-2">
            <Input
              aria-label={`Due date for ${task.title}`}
              defaultValue={toDateValue(task.dueDate)}
              name="dueDate"
              type="date"
            />
            <p className="text-xs text-muted-foreground">Current: {formatDate(task.dueDate)}</p>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Assigned to</p>
          <Select aria-label={`Assignee for ${task.title}`} defaultValue={task.assignedToId ?? ""} name="assignedToId">
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role === Role.OWNER_ADMIN ? "Owner" : "Collaborator"})
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Action</p>
          <SubmitButton idleLabel="Save" pendingLabel="Saving..." variant="outline" />
          <FormMessage state={state} />
        </div>
      </div>
    </form>
  );
}

function SubtaskSetupRow({
  subtask,
  users
}: {
  subtask: {
    id: string;
    title: string;
    isComplete: boolean;
    dueDate: Date | null;
    task: { id: string; title: string };
    assignedToId: string | null;
  };
  users: Array<{ id: string; name: string; role: Role }>;
}) {
  const [state, action] = useFormState(updateSubtaskSetupAction, initialState);

  return (
    <form action={action} className="rounded-xl border border-border p-4">
      <input type="hidden" name="subtaskId" value={subtask.id} />
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
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Due date</p>
          <Input
            aria-label={`Due date for ${subtask.title}`}
            defaultValue={toDateValue(subtask.dueDate)}
            name="dueDate"
            type="date"
          />
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Assigned to</p>
          <Select aria-label={`Assignee for ${subtask.title}`} defaultValue={subtask.assignedToId ?? ""} name="assignedToId">
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role === Role.OWNER_ADMIN ? "Owner" : "Collaborator"})
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Action</p>
          <SubmitButton idleLabel="Save" pendingLabel="Saving..." variant="outline" />
          <FormMessage state={state} />
        </div>
      </div>
    </form>
  );
}

export function AdminSetupPanel({
  currentUserId,
  users,
  tasks,
  subtasks
}: {
  currentUserId: string;
  users: Array<{ id: string; name: string; email: string; role: Role }>;
  tasks: Array<{
    id: string;
    title: string;
    dueDate: Date | null;
    status: string;
    section: { title: string };
    assignedToId: string | null;
    assignedTo: { name: string } | null;
  }>;
  subtasks: Array<{
    id: string;
    title: string;
    isComplete: boolean;
    dueDate: Date | null;
    task: { id: string; title: string };
    assignedToId: string | null;
  }>;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Operational resets</CardTitle>
          <CardDescription>
            Clear seeded completion state before handing the workspace to a live team.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-3">
          <ResetStatusForm
            target="tasks"
            title="Reset task statuses"
            description="Sets every task back to NOT_STARTED and clears completed and blocked timestamps."
          />
          <ResetStatusForm
            target="subtasks"
            title="Reset checklist items"
            description="Marks every checklist item as pending while preserving titles, dates, and assignments."
          />
          <ResetStatusForm
            target="all"
            title="Reset both"
            description="Runs both resets together for a clean operational baseline."
          />
        </CardContent>
      </Card>

      <CreateUserForm />

      <Card>
        <CardHeader>
          <CardTitle>Manage users</CardTitle>
          <CardDescription>
            Update names, emails, roles, and passwords without editing the database directly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <UserRowForm
                key={user.id}
                isCurrentOwner={user.id === currentUserId}
                user={user}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Task setup</CardTitle>
          <CardDescription>
            Assign task owners and due dates in one place. Full task editing stays in the checklist detail pages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => (
              <TaskSetupRow key={task.id} task={task} users={users} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checklist item setup</CardTitle>
          <CardDescription>
            Checklist items now support direct owner assignment and due dates for operational handoff.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subtasks.map((subtask) => (
              <SubtaskSetupRow key={subtask.id} subtask={subtask} users={users} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
