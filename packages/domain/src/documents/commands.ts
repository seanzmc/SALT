import { prisma } from "@salt/db";
import type {
  DocumentDeleteInput,
  DocumentTaskLinkInput,
  DocumentTaskUnlinkInput,
  DocumentUploadMetadataInput,
  SessionPayload
} from "@salt/types";

import { logActivity } from "../activity/log.js";
import { DomainError } from "../shared/domain-error.js";
import { canEditTask } from "../tasks/policies.js";
import { getDocumentWorkspace } from "./queries.js";
import { deleteStoredFile, saveUploadedFile } from "./storage.js";

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
      linkedTaskId: true,
      uploadedById: true,
      storagePath: true
    }
  });

  if (!document) {
    throw new DomainError(404, "NOT_FOUND", "Document not found.");
  }

  return document;
}

function canDeleteDocument(document: { uploadedById: string }, actor: Actor) {
  return actor.role === "OWNER_ADMIN" || document.uploadedById === actor.id;
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
  try {
    const document = await prisma.$transaction(async (tx) => {
      const createdDocument = await tx.document.create({
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
        await tx.taskAttachment.create({
          data: {
            taskId: input.payload.linkedTaskId,
            documentId: createdDocument.id
          }
        });
      }

      await tx.activityLog.create({
        data: {
          actorId: input.actor.id,
          taskId: input.payload.linkedTaskId ?? null,
          type: "DOCUMENT_UPLOADED",
          entityType: "Document",
          entityId: createdDocument.id,
          description: `Uploaded document "${createdDocument.title}".`
        }
      });

      return createdDocument;
    });

    return getDocumentWorkspace(document.id);
  } catch (error) {
    try {
      await deleteStoredFile(storedFile.storagePath);
    } catch (cleanupError) {
      console.error("[documents] Failed to clean up Blob file after upload persistence failure", cleanupError);
    }

    throw error;
  }
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

export async function deleteDocumentCommand(input: {
  actor: Actor;
  payload: DocumentDeleteInput;
}) {
  const document = await getDocumentContext(input.payload.documentId);

  if (!canDeleteDocument(document, input.actor)) {
    throw new DomainError(
      403,
      "FORBIDDEN",
      "Only the uploader or an owner admin can delete this document."
    );
  }

  await deleteStoredFile(document.storagePath);

  await prisma.document.delete({
    where: { id: document.id }
  });

  return {
    documentId: document.id,
    title: document.title
  };
}
