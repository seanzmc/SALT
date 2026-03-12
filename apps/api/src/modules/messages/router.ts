import { Router } from "express";

import {
  createMessageCommand,
  getMessageThread,
  listMessageThreads
} from "@salt/domain";
import type { MessageCreateInput, MessageListFilters } from "@salt/types";
import {
  messageCreateSchema,
  messageThreadIdParamSchema,
  messageThreadListQuerySchema
} from "@salt/validation";

import { AppError } from "../../lib/app-error";
import { asyncHandler } from "../../lib/async-handler";
import { requireSession } from "../../middleware/auth-session";

export const messagesRouter = Router();

function validationError(message: string, fieldErrors?: Record<string, string[] | undefined>) {
  return new AppError(400, "VALIDATION_ERROR", message, fieldErrors);
}

messagesRouter.use(requireSession);

messagesRouter.get(
  "/threads",
  asyncHandler(async (request, response) => {
    const parsed = messageThreadListQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      throw validationError("Invalid message query filters.");
    }

    const filters: MessageListFilters = parsed.data;

    response.status(200).json(await listMessageThreads(filters));
  })
);

messagesRouter.get(
  "/threads/:threadId",
  asyncHandler(async (request, response) => {
    const parsed = messageThreadIdParamSchema.safeParse(request.params);

    if (!parsed.success) {
      throw validationError("Invalid thread id.");
    }

    const data = await getMessageThread(parsed.data.threadId);

    if (!data.thread) {
      throw new AppError(404, "NOT_FOUND", "Message thread not found.");
    }

    response.status(200).json(data);
  })
);

messagesRouter.post(
  "/threads/:threadId/messages",
  asyncHandler(async (request, response) => {
    const parsed = messageCreateSchema.safeParse({
      threadId: request.params.threadId,
      content: request.body.content
    });

    if (!parsed.success) {
      throw validationError(
        "Please enter a message before posting.",
        parsed.error.flatten().fieldErrors
      );
    }

    const payload: MessageCreateInput = parsed.data;

    response.status(201).json(
      await createMessageCommand({
        actor: request.authSession!.user,
        payload
      })
    );
  })
);
