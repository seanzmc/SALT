import { addDays } from "date-fns";
import { hash } from "bcryptjs";
import {
  ActivityType,
  MessageThreadCategory,
  MessageThreadScope,
  PaymentStatus,
  Prisma,
  Role,
  TaskStatus
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  budgetCategorySeeds,
  budgetItemSeeds,
  messageThreadSeeds,
  phaseSeeds,
  projectAnchorDate,
  sectionSeeds,
  seededDocuments,
  tagSeeds,
  taskSeeds
} from "@/prisma/pdf-seed-data";

async function main() {
  await prisma.taskAttachment.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.message.deleteMany();
  await prisma.messageThread.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.document.deleteMany();
  await prisma.taskTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.budgetItem.deleteMany();
  await prisma.budgetCategory.deleteMany();
  await prisma.task.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.timelinePhase.deleteMany();
  await prisma.section.deleteMany();
  await prisma.user.deleteMany();

  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? "ChangeMe123!";
  const collaboratorPassword = process.env.SEED_COLLABORATOR_PASSWORD ?? "ChangeMe123!";

  const [ownerHash, collaboratorHash] = await Promise.all([
    hash(ownerPassword, 10),
    hash(collaboratorPassword, 10)
  ]);

  const owner = await prisma.user.create({
    data: {
      name: "Clinic Owner Admin",
      email: (process.env.SEED_OWNER_EMAIL ?? "owner@clinicbuildout.local").toLowerCase(),
      passwordHash: ownerHash,
      role: Role.OWNER_ADMIN
    }
  });

  const collaborator = await prisma.user.create({
    data: {
      name: "Operations Collaborator",
      email: (process.env.SEED_COLLABORATOR_EMAIL ?? "collaborator@clinicbuildout.local").toLowerCase(),
      passwordHash: collaboratorHash,
      role: Role.COLLABORATOR
    }
  });

  const userByRole = {
    [Role.OWNER_ADMIN]: owner.id,
    [Role.COLLABORATOR]: collaborator.id
  };

  const sections = new Map<string, string>();
  for (const [index, section] of sectionSeeds.entries()) {
    const created = await prisma.section.create({
      data: {
        slug: section.slug,
        title: section.title,
        description: section.description,
        sortOrder: index + 1
      }
    });
    sections.set(section.slug, created.id);
  }

  const phases = new Map<string, string>();
  for (const [index, phase] of phaseSeeds.entries()) {
    const created = await prisma.timelinePhase.create({
      data: {
        slug: phase.slug,
        title: phase.title,
        description: phase.description,
        sortOrder: index + 1,
        status: phase.status,
        notes: phase.notes ?? null,
        blockers: phase.blockers || null,
        startDate: addDays(projectAnchorDate, phase.startOffsetDays),
        endDate: addDays(projectAnchorDate, phase.endOffsetDays),
        milestones: {
          create: phase.milestones.map((title, milestoneIndex) => ({
            title,
            dueDate: addDays(projectAnchorDate, phase.startOffsetDays + milestoneIndex * 5 + 3),
            status:
              phase.status === "IN_PROGRESS" && milestoneIndex === 0
                ? "IN_PROGRESS"
                : "NOT_STARTED"
          }))
        }
      }
    });
    phases.set(phase.slug, created.id);
  }

  const categories = new Map<string, string>();
  for (const [index, category] of budgetCategorySeeds.entries()) {
    const created = await prisma.budgetCategory.create({
      data: {
        slug: category.slug,
        title: category.title,
        description: category.description,
        sortOrder: index + 1
      }
    });
    categories.set(category.slug, created.id);
  }

  const tags = new Map<string, string>();
  for (const tag of tagSeeds) {
    const created = await prisma.tag.create({
      data: {
        name: tag.name,
        color: tag.color
      }
    });
    tags.set(tag.name, created.id);
  }

  const tasks = new Map<string, string>();
  for (const task of taskSeeds) {
    const created = await prisma.task.create({
      data: {
        sectionId: sections.get(task.sectionSlug)!,
        phaseId: task.phaseSlug ? phases.get(task.phaseSlug)! : null,
        createdById: owner.id,
        assignedToId: task.assigneeRole ? userByRole[task.assigneeRole] : null,
        title: task.title,
        description: task.description,
        notes: task.notes ?? null,
        priority: task.priority,
        status: task.status ?? TaskStatus.NOT_STARTED,
        openingPriority: task.openingPriority,
        dueDate: addDays(projectAnchorDate, task.dueOffsetDays),
        blockedReason: task.blockedReason ?? null,
        roomName: task.roomName ?? null,
        isRiskItem: task.isRiskItem ?? false,
        isVerificationNote: task.isVerificationNote ?? false,
        isMasterOpeningItem: task.isMasterOpeningItem ?? false,
        isRoomProcurement: task.isRoomProcurement ?? false,
        subtasks: {
          create:
            task.subtasks?.map((title, index) => ({
              title,
              sortOrder: index + 1
            })) ?? []
        },
        taskTags: {
          create:
            task.tags?.map((tagName) => ({
              tagId: tags.get(tagName)!
            })) ?? []
        }
      }
    });

    tasks.set(task.key, created.id);
  }

  for (const task of taskSeeds) {
    if (!task.dependsOn?.length) {
      continue;
    }

    for (const dependencyKey of task.dependsOn) {
      await prisma.taskDependency.create({
        data: {
          taskId: tasks.get(task.key)!,
          dependsOnTaskId: tasks.get(dependencyKey)!
        }
      });
    }
  }

  const budgetItems = new Map<string, string>();
  for (const item of budgetItemSeeds) {
    const created = await prisma.budgetItem.create({
      data: {
        categoryId: categories.get(item.categorySlug)!,
        lineItem: item.lineItem,
        priority: item.priority,
        openingPriority: item.openingPriority,
        estimate: new Prisma.Decimal(item.estimate),
        actual:
          item.categorySlug === "build-out"
            ? new Prisma.Decimal(18000)
            : item.categorySlug === "software-tech"
              ? new Prisma.Decimal(2400)
              : new Prisma.Decimal(0),
        vendor: item.vendor,
        depositDue: addDays(projectAnchorDate, item.depositOffsetDays),
        leadTimeDays: item.leadTimeDays,
        responsibleOwnerId:
          item.categorySlug === "build-out" ||
          item.categorySlug === "laser-device-equipment" ||
          item.categorySlug === "working-capital"
            ? owner.id
            : collaborator.id,
        notes: item.notes,
        paidStatus:
          item.categorySlug === "build-out"
            ? PaymentStatus.PARTIALLY_PAID
            : item.categorySlug === "software-tech"
              ? PaymentStatus.DEPOSIT_DUE
              : PaymentStatus.NOT_PAID,
        isPdfPlaceholder: item.isPdfPlaceholder
      }
    });

    budgetItems.set(item.lineItem, created.id);
  }

  const documentIds: string[] = [];
  for (const seededDocument of seededDocuments) {
    const created = await prisma.document.create({
      data: {
        ...seededDocument,
        uploadedById: owner.id,
        linkedTaskId: tasks.get("master-room-plan") ?? null
      }
    });
    documentIds.push(created.id);
  }

  await prisma.taskComment.createMany({
    data: [
      {
        taskId: tasks.get("master-room-plan")!,
        authorId: owner.id,
        content:
          "Initial room program is aligned to the planning guide. Need final confirmation on sink strategy before permit set is locked."
      },
      {
        taskId: tasks.get("device-selection")!,
        authorId: collaborator.id,
        content:
          "Two vendors are in the final comparison set. Waiting on service response-time and consumables lock-in details."
      },
      {
        taskId: tasks.get("permits-and-occupancy-path")!,
        authorId: owner.id,
        content:
          "Contractor is confirming the local inspection sequence and whether any landlord review precedes municipal submission."
      }
    ]
  });

  await prisma.taskAttachment.create({
    data: {
      taskId: tasks.get("master-room-plan")!,
      documentId: documentIds[0]
    }
  });

  for (const threadSeed of messageThreadSeeds) {
    const thread = await prisma.messageThread.create({
      data: {
        title: threadSeed.title,
        scope: threadSeed.scope === "GENERAL" ? MessageThreadScope.GENERAL : MessageThreadScope.TASK,
        category: threadSeed.category,
        createdById: owner.id
      }
    });

    for (const [index, content] of threadSeed.messages.entries()) {
      await prisma.message.create({
        data: {
          threadId: thread.id,
          authorId: index % 2 === 0 ? owner.id : collaborator.id,
          content
        }
      });
    }
  }

  const taskThread = await prisma.messageThread.create({
    data: {
      title: "Task thread: Final room plan approval",
      scope: MessageThreadScope.TASK,
      category: MessageThreadCategory.OPERATIONS,
      createdById: owner.id,
      taskId: tasks.get("master-room-plan")!
    }
  });

  await prisma.message.createMany({
    data: [
      {
        threadId: taskThread.id,
        authorId: owner.id,
        content: "Use this thread for designer, GC, and owner notes tied directly to the room plan approval task."
      },
      {
        threadId: taskThread.id,
        authorId: collaborator.id,
        content: "Acoustic insulation and provider-workroom storage are the two current layout revisions under review."
      }
    ]
  });

  await prisma.activityLog.createMany({
    data: [
      {
        actorId: owner.id,
        taskId: tasks.get("master-room-plan")!,
        type: ActivityType.TASK_STATUS_CHANGED,
        entityType: "Task",
        entityId: tasks.get("master-room-plan")!,
        description: "Room plan moved to in progress."
      },
      {
        actorId: collaborator.id,
        taskId: tasks.get("device-selection")!,
        type: ActivityType.TASK_COMMENTED,
        entityType: "TaskComment",
        entityId: tasks.get("device-selection")!,
        description: "Added vendor comparison note for the primary device."
      },
      {
        actorId: owner.id,
        type: ActivityType.BUDGET_UPDATED,
        entityType: "BudgetItem",
        entityId: budgetItems.get("GC labor, framing, drywall, electrical, plumbing, HVAC, paint, flooring, doors, millwork, signage")!,
        description: "Recorded early build-out spend against the GC scope."
      },
      {
        actorId: owner.id,
        taskId: tasks.get("master-room-plan")!,
        type: ActivityType.DOCUMENT_UPLOADED,
        entityType: "Document",
        entityId: documentIds[0],
        description: "Seeded planning guide document metadata linked to room-plan work."
      },
      {
        actorId: collaborator.id,
        type: ActivityType.MESSAGE_POSTED,
        entityType: "MessageThread",
        entityId: taskThread.id,
        description: "Posted layout feedback in the task-specific room-plan thread."
      }
    ]
  });

  console.log("Seed complete.");
  console.log(`Owner login: ${(process.env.SEED_OWNER_EMAIL ?? "owner@clinicbuildout.local").toLowerCase()} / ${ownerPassword}`);
  console.log(
    `Collaborator login: ${(process.env.SEED_COLLABORATOR_EMAIL ?? "collaborator@clinicbuildout.local").toLowerCase()} / ${collaboratorPassword}`
  );
  console.log("Change the seeded passwords immediately after first login.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
