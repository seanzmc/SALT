import { Prisma } from "@prisma/client";

import { prisma } from "@salt/db";
import type { DocumentListFilters } from "@salt/types";

import { serializeDocumentListResponse, serializeDocumentWorkspace } from "./serializers.js";

export async function listDocuments(filters: DocumentListFilters = {}) {
  const where: Prisma.DocumentWhereInput = {
    AND: [
      filters.q
        ? {
            OR: [
              { title: { contains: filters.q, mode: "insensitive" } },
              { notes: { contains: filters.q, mode: "insensitive" } },
              { originalName: { contains: filters.q, mode: "insensitive" } }
            ]
          }
        : {},
      filters.category ? { category: filters.category } : {}
    ]
  };

  const [documents, tasks, budgetItems] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true
          }
        },
        linkedTask: {
          select: { id: true, title: true }
        },
        linkedBudgetItem: {
          select: { id: true, lineItem: true }
        },
        taskAttachments: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                archivedAt: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.task.findMany({
      select: {
        id: true,
        title: true,
        archivedAt: true,
        assignedToId: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { title: "asc" }
    }),
    prisma.budgetItem.findMany({
      select: { id: true, lineItem: true },
      orderBy: { lineItem: "asc" }
    })
  ]);

  return serializeDocumentListResponse({
    documents,
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      archivedAt: task.archivedAt?.toISOString() ?? null,
      assignedToId: task.assignedToId,
      assignedTo: task.assignedTo
    })),
    budgetItems
  });
}

export async function getDocumentWorkspace(documentId: string) {
  const [document, tasks, budgetItems] = await Promise.all([
    prisma.document.findUnique({
      where: { id: documentId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true
          }
        },
        linkedTask: {
          select: { id: true, title: true }
        },
        linkedBudgetItem: {
          select: { id: true, lineItem: true }
        },
        taskAttachments: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                archivedAt: true
              }
            }
          }
        }
      }
    }),
    prisma.task.findMany({
      select: {
        id: true,
        title: true,
        archivedAt: true,
        assignedToId: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { title: "asc" }
    }),
    prisma.budgetItem.findMany({
      select: { id: true, lineItem: true },
      orderBy: { lineItem: "asc" }
    })
  ]);

  return serializeDocumentWorkspace({
    document,
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      archivedAt: task.archivedAt?.toISOString() ?? null,
      assignedToId: task.assignedToId,
      assignedTo: task.assignedTo
    })),
    budgetItems
  });
}

export async function getDocumentAccess(documentId: string) {
  return prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      storagePath: true,
      mimeType: true,
      originalName: true
    }
  });
}
