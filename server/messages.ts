import { prisma } from "@/lib/prisma";

export async function getMessageBoardData() {
  return prisma.messageThread.findMany({
    include: {
      createdBy: true,
      task: {
        select: { id: true, title: true }
      },
      messages: {
        include: {
          author: true,
          attachmentDocument: true
        },
        orderBy: { createdAt: "asc" }
      }
    },
    orderBy: { updatedAt: "desc" }
  });
}
