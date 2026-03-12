import { Router } from "express";

import { updateAccountEmailCommand, updateAccountPasswordCommand } from "@salt/domain";
import type { AccountEmailUpdateInput, AccountPasswordUpdateInput } from "@salt/types";
import { accountEmailSchema, accountPasswordSchema } from "@salt/validation";

import { AppError } from "../../lib/app-error";
import { asyncHandler } from "../../lib/async-handler";
import { requireSession } from "../../middleware/auth-session";

export const accountRouter = Router();

function validationError(message: string, fieldErrors?: Record<string, string[] | undefined>) {
  return new AppError(400, "VALIDATION_ERROR", message, fieldErrors);
}

accountRouter.use(requireSession);

accountRouter.patch(
  "/email",
  asyncHandler(async (request, response) => {
    const parsed = accountEmailSchema.safeParse(request.body);

    if (!parsed.success) {
      throw validationError(
        "Please enter a valid email address.",
        parsed.error.flatten().fieldErrors
      );
    }

    const payload: AccountEmailUpdateInput = parsed.data;

    response.status(200).json(
      await updateAccountEmailCommand({
        actor: request.authSession!.user,
        payload
      })
    );
  })
);

accountRouter.patch(
  "/password",
  asyncHandler(async (request, response) => {
    const parsed = accountPasswordSchema.safeParse(request.body);

    if (!parsed.success) {
      throw validationError(
        "Please correct the highlighted password fields.",
        parsed.error.flatten().fieldErrors
      );
    }

    const payload: AccountPasswordUpdateInput = parsed.data;

    response.status(200).json(
      await updateAccountPasswordCommand({
        actor: request.authSession!.user,
        payload
      })
    );
  })
);
