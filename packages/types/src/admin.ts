import type { MessageResponse } from "./api";
import type { UserRole } from "./auth";
import type { TaskStatus } from "./tasks";

export const ADMIN_RESET_TARGET_VALUES = ["tasks", "subtasks", "all"] as const;

export type AdminResetTarget = (typeof ADMIN_RESET_TARGET_VALUES)[number];

export type AdminUserRecord = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  openTaskCount: number;
  openSubtaskCount: number;
};

export type AdminAssignmentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type AdminSetupTask = {
  id: string;
  title: string;
  dueDate: string | null;
  status: TaskStatus;
  section: {
    title: string;
  };
  assignedToId: string | null;
  assignedTo: {
    name: string;
  } | null;
};

export type AdminSetupSubtask = {
  id: string;
  title: string;
  isComplete: boolean;
  dueDate: string | null;
  task: {
    id: string;
    title: string;
  };
  assignedToId: string | null;
};

export type AdminSetupData = {
  users: AdminUserRecord[];
  activeAssignmentUsers: AdminAssignmentUser[];
  tasks: AdminSetupTask[];
  subtasks: AdminSetupSubtask[];
};

export type AdminCreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export type AdminUpdateUserInput = {
  userId: string;
  name: string;
  email: string;
  password: string | null;
  role: UserRole;
};

export type AdminDeactivateUserInput = {
  userId: string;
  replacementUserId: string | null;
  transferTasks: boolean;
  transferSubtasks: boolean;
};

export type AdminReactivateUserInput = {
  userId: string;
};

export type AdminTaskSetupUpdateInput = {
  taskId: string;
  dueDate: string | null;
  assignedToId: string | null;
};

export type AdminSubtaskSetupUpdateInput = {
  subtaskId: string;
  dueDate: string | null;
  assignedToId: string | null;
};

export type AdminStatusResetInput = {
  target: AdminResetTarget;
};

export type AdminMutationMessage = MessageResponse;
