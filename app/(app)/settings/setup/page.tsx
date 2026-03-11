import Link from "next/link";
import { TaskStatus } from "@prisma/client";

import { AdminSetupPanel } from "@/components/settings/admin-setup-panel";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { requireOwner } from "@/server/authz";

export default async function AdminSetupPage() {
  const session = await requireOwner();

  const [users, activeAssignmentUsers, tasks, subtasks] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        assignedTasks: {
          where: {
            archivedAt: null,
            status: { not: TaskStatus.COMPLETE }
          },
          select: { id: true }
        },
        assignedSubtasks: {
          where: {
            archivedAt: null,
            isComplete: false
          },
          select: { id: true }
        }
      }
    }),
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    }),
    prisma.task.findMany({
      where: { archivedAt: null },
      orderBy: [{ dueDate: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        assignedToId: true,
        assignedTo: {
          select: {
            name: true
          }
        },
        section: {
          select: {
            title: true
          }
        }
      }
    }),
    prisma.subtask.findMany({
      where: { archivedAt: null },
      orderBy: [
        { task: { title: "asc" } },
        { sortOrder: "asc" }
      ],
      select: {
        id: true,
        title: true,
        isComplete: true,
        dueDate: true,
        assignedToId: true,
        task: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operational setup"
        description="Owner-only workspace for preparing SALT for live use: reset seeded progress, create collaborators, and set assignments and due dates without touching the database."
        actions={
          <Link
            className={cn(buttonVariants({ variant: "outline" }))}
            href="/settings/account"
          >
            Account settings
          </Link>
        }
      />
      <AdminSetupPanel
        activeAssignmentUsers={activeAssignmentUsers}
        currentUserId={session.user.id}
        subtasks={subtasks}
        tasks={tasks}
        users={users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          openTaskCount: user.assignedTasks.length,
          openSubtaskCount: user.assignedSubtasks.length
        }))}
      />
    </div>
  );
}
