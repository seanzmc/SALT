import { prisma } from "@salt/db";
import type { MessageCreateInput, SessionPayload } from "@salt/types";

import { logActivity } from "../activity/log.js";
import { DomainError } from "../shared/domain-error.js";
import { getMessageThread } from "./queries.js";

type Actor = SessionPayload["user"];

async function getThreadContext(threadId: string) {
  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    select: {
      id: true,
      taskId: true
    }
  });

  if (!thread) {
    throw new DomainError(404, "NOT_FOUND", "Message thread not found.");
  }

  return thread;
}

export async function createMessageCommand(input: {
  actor: Actor;
  payload: MessageCreateInput;
}) {
  const thread = await getThreadContext(input.payload.threadId);

  const message = await prisma.message.create({
    data: {
      threadId: input.payload.threadId,
      authorId: input.actor.id,
      content: input.payload.content.trim()
    }
  });

  await prisma.messageThread.update({
    where: { id: input.payload.threadId },
    data: { updatedAt: new Date() }
  });

  await logActivity({
    actorId: input.actor.id,
    taskId: thread.taskId,
    type: "MESSAGE_POSTED",
    entityType: "Message",
    entityId: message.id,
    description: "Posted a message in the internal board."
  });

  return getMessageThread(input.payload.threadId);
}
