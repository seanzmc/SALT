import { prisma } from "@/lib/prisma";

export async function getBudgetData(categorySlug?: string) {
  const where = categorySlug ? { category: { slug: categorySlug } } : {};

  const [categories, items] = await Promise.all([
    prisma.budgetCategory.findMany({
      include: {
        items: true
      },
      orderBy: { sortOrder: "asc" }
    }),
    prisma.budgetItem.findMany({
      where,
      include: {
        category: true,
        responsibleOwner: true
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { lineItem: "asc" }]
    })
  ]);

  return { categories, items };
}
