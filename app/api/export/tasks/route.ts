import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const tasks = await prisma.task.findMany({
    include: {
      section: true,
      assignedTo: true
    },
    orderBy: { dueDate: "asc" }
  });

  const csv = [
    ["Title", "Section", "Status", "Priority", "Opening Priority", "Due Date", "Assigned To"].join(","),
    ...tasks.map((task) =>
      [
        JSON.stringify(task.title),
        JSON.stringify(task.section.title),
        task.status,
        task.priority,
        task.openingPriority,
        task.dueDate?.toISOString().slice(0, 10) ?? "",
        JSON.stringify(task.assignedTo?.name ?? "")
      ].join(",")
    )
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="clinic-buildout-tasks.csv"'
    }
  });
}
