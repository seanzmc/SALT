import { prisma } from "@salt/db";
import type { BudgetListFilters, BudgetWorkspaceData } from "@salt/types";

import { serializeBudgetWorkspace } from "./serializers.js";

export async function getBudgetWorkspace(
  filters: BudgetListFilters = {}
): Promise<BudgetWorkspaceData> {
  const where = filters.category ? { category: { slug: filters.category } } : {};

  const [categories, items] = await Promise.all([
    prisma.budgetCategory.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        description: true
      },
      orderBy: { sortOrder: "asc" }
    }),
    prisma.budgetItem.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            slug: true,
            title: true,
            description: true
          }
        },
        responsibleOwner: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { lineItem: "asc" }]
    })
  ]);

  return serializeBudgetWorkspace({
    categories,
    items
  });
}
