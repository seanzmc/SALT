import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const items = await prisma.budgetItem.findMany({
    include: {
      category: true,
      responsibleOwner: true
    },
    orderBy: [{ category: { sortOrder: "asc" } }, { lineItem: "asc" }]
  });

  const csv = [
    ["Category", "Line Item", "Priority", "Opening Priority", "Estimate", "Actual", "Vendor", "Paid Status", "Owner"].join(","),
    ...items.map((item) =>
      [
        JSON.stringify(item.category.title),
        JSON.stringify(item.lineItem),
        item.priority,
        item.openingPriority,
        Number(item.estimate),
        Number(item.actual),
        JSON.stringify(item.vendor ?? ""),
        item.paidStatus,
        JSON.stringify(item.responsibleOwner?.name ?? "")
      ].join(",")
    )
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="clinic-buildout-budget.csv"'
    }
  });
}
