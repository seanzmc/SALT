import { prisma } from "@salt/db";
import type {
  DocumentTaskLinkInput,
  DocumentTaskUnlinkInput,
  DocumentUploadMetadataInput,
  SessionPayload
} from "@salt/types";

import { logActivity } from "../activity/log.js";
import { DomainError } from "../shared/domain-error.js";
import { canEditTask } from "../tasks/policies.js";
import { getDocumentWorkspace } from "./queries.js";
import { saveUploadedFile } from "./storage.js";

type Actor = SessionPayload["user"];

async function getTaskLinkContext(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      title: true,
      archivedAt: true,
      assignedToId: true
    }
  });

  if (!task) {
    throw new DomainError(404, "NOT_FOUND", "Task not found.");
  }

  return task;
}

async function requireTaskDocumentAccess(taskId: string, actor: Actor) {
  const task = await getTaskLinkContext(taskId);

  if (task.archivedAt) {
    throw new DomainError(409, "FORBIDDEN", "Archived tasks cannot receive new document attachments.");
  }

  if (
    !canEditTask({
      role: actor.role,
      userId: actor.id,
      assignedToId: task.assignedToId
    })
  ) {
    throw new DomainError(
      403,
      "FORBIDDEN",
      "Collaborators can only attach documents to tasks assigned to them."
    );
  }

  return task;
}

async function getDocumentContext(documentId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      title: true,
      linkedTaskId: true
    }
  });

  if (!document) {
    throw new DomainError(404, "NOT_FOUND", "Document not found.");
  }

  return document;
}

export async function uploadDocumentCommand(input: {
  actor: Actor;
  payload: DocumentUploadMetadataInput;
  file: File;
}) {
  if (input.payload.linkedTaskId) {
    await requireTaskDocumentAccess(input.payload.linkedTaskId, input.actor);
  }

  const storedFile = await saveUploadedFile(input.file);

  const document = await prisma.document.create({
    data: {
      title: input.payload.title.trim(),
      category: input.payload.category,
      notes: input.payload.notes?.trim() || null,
      linkedTaskId: input.payload.linkedTaskId,
      linkedBudgetItemId: input.payload.linkedBudgetItemId,
      uploadedById: input.actor.id,
      ...storedFile
    }
  });

  if (input.payload.linkedTaskId) {
    await prisma.taskAttachment.create({
      data: {
        taskId: input.payload.linkedTaskId,
        documentId: document.id
      }
    });
  }

  await logActivity({
    actorId: input.actor.id,
    taskId: input.payload.linkedTaskId,
    type: "DOCUMENT_UPLOADED",
    entityType: "Document",
    entityId: document.id,
    description: `Uploaded document "${document.title}".`
  });

  return getDocumentWorkspace(document.id);
}

export async function linkDocumentToTaskCommand(input: {
  actor: Actor;
  payload: DocumentTaskLinkInput;
}) {
  const [task, document] = await Promise.all([
    requireTaskDocumentAccess(input.payload.taskId, input.actor),
    getDocumentContext(input.payload.documentId)
  ]);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.taskAttachment.findUnique({
      where: {
        taskId_documentId: {
          taskId: input.payload.taskId,
          documentId: input.payload.documentId
        }
      }
    });

    if (!existing) {
      await tx.taskAttachment.create({
        data: {
          taskId: input.payload.taskId,
          documentId: input.payload.documentId
        }
      });
    }

    if (!document.linkedTaskId) {
      await tx.document.update({
        where: { id: input.payload.documentId },
        data: { linkedTaskId: input.payload.taskId }
      });
    }
  });

  await logActivity({
    actorId: input.actor.id,
    taskId: task.id,
    type: "TASK_UPDATED",
    entityType: "TaskAttachment",
    entityId: input.payload.documentId,
    description: `Linked document "${document.title}" to the task.`
  });

  return getDocumentWorkspace(document.id);
}

export async function unlinkDocumentFromTaskCommand(input: {
  actor: Actor;
  payload: DocumentTaskUnlinkInput;
}) {
  const [task, document] = await Promise.all([
    getTaskLinkContext(input.payload.taskId),
    getDocumentContext(input.payload.documentId)
  ]);

  if (
    !canEditTask({
      role: input.actor.role,
      userId: input.actor.id,
      assignedToId: task.assignedToId
    })
  ) {
    throw new DomainError(
      403,
      "FORBIDDEN",
      "Collaborators can only attach documents to tasks assigned to them."
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.taskAttachment.deleteMany({
      where: {
        taskId: input.payload.taskId,
        documentId: input.payload.documentId
      }
    });

    if (document.linkedTaskId === input.payload.taskId) {
      const remainingAttachment = await tx.taskAttachment.findFirst({
        where: {
          documentId: input.payload.documentId,
          taskId: { not: input.payload.taskId }
        },
        select: {
          taskId: true
        }
      });

      await tx.document.update({
        where: { id: input.payload.documentId },
        data: {
          linkedTaskId: remainingAttachment?.taskId ?? null
        }
      });
    }
  });

  await logActivity({
    actorId: input.actor.id,
    taskId: task.id,
    type: "TASK_UPDATED",
    entityType: "TaskAttachment",
    entityId: input.payload.documentId,
    description: `Unlinked document "${document.title}" from the task.`
  });

  return getDocumentWorkspace(document.id);
}
