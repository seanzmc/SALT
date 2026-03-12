import type {
  AdminSetupData,
  AdminSetupSubtask,
  AdminSetupTask,
  AdminUserRecord
} from "@salt/types";

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null;
}

export function serializeAdminUser(input: {
  id: string;
  name: string;
  email: string;
  role: AdminUserRecord["role"];
  isActive: boolean;
  assignedTasks: Array<{ id: string }>;
  assignedSubtasks: Array<{ id: string }>;
}): AdminUserRecord {
  return {
    id: input.id,
    name: input.name,
    email: input.email,
    role: input.role,
    isActive: input.isActive,
    openTaskCount: input.assignedTasks.length,
    openSubtaskCount: input.assignedSubtasks.length
  };
}

export function serializeAdminTask(input: {
  id: string;
  title: string;
  dueDate: Date | null;
  status: AdminSetupTask["status"];
  assignedToId: string | null;
  assignedTo: { name: string } | null;
  section: { title: string };
}): AdminSetupTask {
  return {
    id: input.id,
    title: input.title,
    dueDate: toIsoString(input.dueDate),
    status: input.status,
    assignedToId: input.assignedToId,
    assignedTo: input.assignedTo,
    section: input.section
  };
}

export function serializeAdminSubtask(input: {
  id: string;
  title: string;
  isComplete: boolean;
  dueDate: Date | null;
  assignedToId: string | null;
  task: { id: string; title: string };
}): AdminSetupSubtask {
  return {
    id: input.id,
    title: input.title,
    isComplete: input.isComplete,
    dueDate: toIsoString(input.dueDate),
    assignedToId: input.assignedToId,
    task: input.task
  };
}

export function serializeAdminSetupData(input: {
  users: Parameters<typeof serializeAdminUser>[0][];
  activeAssignmentUsers: AdminSetupData["activeAssignmentUsers"];
  tasks: Parameters<typeof serializeAdminTask>[0][];
  subtasks: Parameters<typeof serializeAdminSubtask>[0][];
}): AdminSetupData {
  return {
    users: input.users.map(serializeAdminUser),
    activeAssignmentUsers: input.activeAssignmentUsers,
    tasks: input.tasks.map(serializeAdminTask),
    subtasks: input.subtasks.map(serializeAdminSubtask)
  };
}
