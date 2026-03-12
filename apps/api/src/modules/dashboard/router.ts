import { Router } from "express";

import { getDashboardActivity, getDashboardSummary } from "@salt/domain";

import { asyncHandler } from "../../lib/async-handler.js";
import { requireSession } from "../../middleware/auth-session.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireSession);

dashboardRouter.get(
  "/summary",
  asyncHandler(async (_request, response) => {
    response.status(200).json(await getDashboardSummary());
  })
);

dashboardRouter.get(
  "/activity",
  asyncHandler(async (_request, response) => {
    response.status(200).json(await getDashboardActivity());
  })
);
