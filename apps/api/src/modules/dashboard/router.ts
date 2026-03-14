import { Router } from "express";

import { dismissDashboardActivity, getDashboardActivity, getDashboardSummary } from "@salt/domain";
import type { DashboardActivityDismissInput } from "@salt/types";
import { dashboardActivityDismissSchema } from "@salt/validation";

import { AppError } from "../../lib/app-error.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { requireSession } from "../../middleware/auth-session.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireSession);

function validationError(message: string, fieldErrors?: Record<string, string[] | undefined>) {
  return new AppError(400, "VALIDATION_ERROR", message, fieldErrors);
}

dashboardRouter.get(
  "/summary",
  asyncHandler(async (_request, response) => {
    response.status(200).json(await getDashboardSummary());
  })
);

dashboardRouter.get(
  "/activity",
  asyncHandler(async (request, response) => {
    response.status(200).json(await getDashboardActivity(request.authSession!.user.id));
  })
);

dashboardRouter.post(
  "/activity/:activityId/dismiss",
  asyncHandler(async (request, response) => {
    const parsed = dashboardActivityDismissSchema.safeParse(request.params);

    if (!parsed.success) {
      throw validationError("Invalid activity id.");
    }

    const payload: DashboardActivityDismissInput = {
      activityId: parsed.data.activityId
    };

    response.status(200).json(
      await dismissDashboardActivity({
        actor: request.authSession!.user,
        payload
      })
    );
  })
);
