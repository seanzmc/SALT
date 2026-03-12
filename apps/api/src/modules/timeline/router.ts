import { Router } from "express";

import { getTimelineWorkspace, updateTimelinePhaseCommand } from "@salt/domain";
import {
  timelinePhaseIdParamSchema,
  timelinePhaseUpdateSchema
} from "@salt/validation";

import { AppError } from "../../lib/app-error";
import { asyncHandler } from "../../lib/async-handler";
import { requireSession } from "../../middleware/auth-session";

export const timelineRouter = Router();

function validationError(message: string, fieldErrors?: Record<string, string[] | undefined>) {
  return new AppError(400, "VALIDATION_ERROR", message, fieldErrors);
}

timelineRouter.use(requireSession);

timelineRouter.get(
  "/phases",
  asyncHandler(async (_request, response) => {
    response.status(200).json(await getTimelineWorkspace());
  })
);

timelineRouter.patch(
  "/phases/:phaseId",
  asyncHandler(async (request, response) => {
    const params = timelinePhaseIdParamSchema.safeParse(request.params);

    if (!params.success) {
      throw validationError("Invalid timeline phase id.");
    }

    const parsed = timelinePhaseUpdateSchema.safeParse({
      ...request.body,
      phaseId: params.data.phaseId
    });

    if (!parsed.success) {
      throw validationError(
        "Please correct the highlighted timeline fields.",
        parsed.error.flatten().fieldErrors
      );
    }

    response.status(200).json(
      await updateTimelinePhaseCommand({
        actor: request.authSession!.user,
        payload: {
          phaseId: parsed.data.phaseId,
          status: parsed.data.status,
          notes: parsed.data.notes || null,
          blockers: parsed.data.blockers || null,
          startDate: parsed.data.startDate || null,
          endDate: parsed.data.endDate || null
        }
      })
    );
  })
);
