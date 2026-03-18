import { Router } from "express";

import {
  updateAccountEmailCommand,
  updateAccountNameCommand,
  updateAccountPasswordCommand
} from "@salt/domain";
import type {
  AccountEmailUpdateInput,
  AccountNameUpdateInput,
  AccountPasswordUpdateInput
} from "@salt/types";
import { accountEmailSchema, accountNameSchema, accountPasswordSchema } from "@salt/validation";

import { AppError } from "../../lib/app-error.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { logRuntimeMutation } from "../../lib/runtime-diagnostics.js";
import { requireSession } from "../../middleware/auth-session.js";

export const accountRouter = Router();

function validationError(message: string, fieldErrors?: Record<string, string[] | undefined>) {
  return new AppError(400, "VALIDATION_ERROR", message, fieldErrors);
}

accountRouter.use(requireSession);

accountRouter.patch(
  "/name",
  asyncHandler(async (request, response) => {
    const parsed = accountNameSchema.safeParse(request.body);

    if (!parsed.success) {
      throw validationError(
        "Please enter a valid name.",
        parsed.error.flatten().fieldErrors
      );
    }

    const payload: AccountNameUpdateInput = {
      name: parsed.data.name
    };

    const result = await updateAccountNameCommand({
      actor: request.authSession!.user,
      payload
    });

    logRuntimeMutation({
      action: "account.name_update",
      userId: request.authSession!.user.id,
      email: request.authSession!.user.email
    });

    response.status(200).json(result);
  })
);

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

    const payload: AccountEmailUpdateInput = {
      email: parsed.data.email
    };

    const result = await updateAccountEmailCommand({
      actor: request.authSession!.user,
      payload
    });

    logRuntimeMutation({
      action: "account.email_update",
      userId: request.authSession!.user.id,
      email: payload.email
    });

    response.status(200).json(result);
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

    const payload: AccountPasswordUpdateInput = {
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
      confirmPassword: parsed.data.confirmPassword
    };

    const result = await updateAccountPasswordCommand({
      actor: request.authSession!.user,
      payload
    });

    logRuntimeMutation({
      action: "account.password_update",
      userId: request.authSession!.user.id,
      email: request.authSession!.user.email
    });

    response.status(200).json(result);
  })
);
