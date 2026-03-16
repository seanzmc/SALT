import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function getDocumentData(filters: { q?: string; category?: string } = {}) {
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
      filters.category ? { category: filters.category as never } : {}
    ]
  };

  const [documents, tasks, budgetItems] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        uploadedBy: true,
        linkedTask: {
          select: { id: true, title: true }
        },
        linkedBudgetItem: {
          select: { id: true, lineItem: true }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.task.findMany({
      select: { id: true, title: true },
      orderBy: { title: "asc" }
    }),
    prisma.budgetItem.findMany({
      select: { id: true, lineItem: true },
      orderBy: { lineItem: "asc" }
    })
  ]);

  return { documents, tasks, budgetItems };
}
