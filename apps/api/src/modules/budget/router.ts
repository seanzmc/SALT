import { Router } from "express";

import { getBudgetWorkspace, updateBudgetItemCommand } from "@salt/domain";
import type { BudgetItemUpdateInput, BudgetListFilters } from "@salt/types";
import {
  budgetItemIdParamSchema,
  budgetItemUpdateSchema,
  budgetListQuerySchema
} from "@salt/validation";

import { AppError } from "../../lib/app-error";
import { asyncHandler } from "../../lib/async-handler";
import { requireSession } from "../../middleware/auth-session";

export const budgetRouter = Router();

function validationError(message: string, fieldErrors?: Record<string, string[] | undefined>) {
  return new AppError(400, "VALIDATION_ERROR", message, fieldErrors);
}

budgetRouter.use(requireSession);

budgetRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const parsed = budgetListQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      throw validationError("Invalid budget query filters.");
    }

    const filters: BudgetListFilters = {
      category: parsed.data.category
    };

    response.status(200).json(await getBudgetWorkspace(filters));
  })
);

budgetRouter.patch(
  "/items/:itemId",
  asyncHandler(async (request, response) => {
    const params = budgetItemIdParamSchema.safeParse(request.params);

    if (!params.success) {
      throw validationError("Invalid budget item id.");
    }

    const parsed = budgetItemUpdateSchema.safeParse({
      ...request.body,
      itemId: params.data.itemId
    });

    if (!parsed.success) {
      throw validationError(
        "Please correct the highlighted budget fields.",
        parsed.error.flatten().fieldErrors
      );
    }

    const payload: BudgetItemUpdateInput = {
      itemId: parsed.data.itemId,
      actual: parsed.data.actual,
      vendor: parsed.data.vendor || null,
      paidStatus: parsed.data.paidStatus,
      notes: parsed.data.notes || null
    };

    response.status(200).json(
      await updateBudgetItemCommand({
        actor: request.authSession!.user,
        payload
      })
    );
  })
);
