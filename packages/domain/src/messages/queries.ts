import { Prisma } from "@prisma/client";

import { prisma } from "@salt/db";
import type { MessageListFilters } from "@salt/types";

import { serializeMessageThread, serializeMessageThreadListResponse } from "./serializers";

export async function listMessageThreads(filters: MessageListFilters = {}) {
  const where: Prisma.MessageThreadWhereInput = {
    AND: [
      filters.q
        ? {
            OR: [
              { title: { contains: filters.q, mode: "insensitive" } },
              { task: { title: { contains: filters.q, mode: "insensitive" } } },
              {
                messages: {
                  some: {
                    content: { contains: filters.q, mode: "insensitive" }
                  }
                }
              }
            ]
          }
        : {},
      filters.scope && filters.scope !== "ALL" ? { scope: filters.scope } : {},
      filters.category && filters.category !== "ALL" ? { category: filters.category } : {}
    ]
  };

  const threads = await prisma.messageThread.findMany({
    where,
    include: {
      task: {
        select: { id: true, title: true }
      },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      _count: {
        select: { messages: true }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  return serializeMessageThreadListResponse({
    threads: threads.map((thread) => ({
      id: thread.id,
      title: thread.title,
      scope: thread.scope,
      category: thread.category,
      updatedAt: thread.updatedAt,
      task: thread.task,
      latestMessage: thread.messages[0] ?? null,
      messageCount: thread._count.messages
    }))
  });
}

export async function getMessageThread(threadId: string) {
  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true
        }
      },
      task: {
        select: { id: true, title: true }
      },
      messages: {
        include: {
          author: {
            select: {
              id: true,
              name: true
            }
          },
          attachmentDocument: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: { createdAt: "asc" }
      }
    }
  });

  return serializeMessageThread({
    thread
  });
}
