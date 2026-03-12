import { prisma } from "@salt/db";
import type { BudgetItemUpdateInput, SessionPayload } from "@salt/types";

import { logActivity } from "../activity/log.js";
import { DomainError } from "../shared/domain-error.js";
import { serializeBudgetItem } from "./serializers.js";

type Actor = SessionPayload["user"];

function assertOwner(actor: Actor) {
  if (actor.role !== "OWNER_ADMIN") {
    throw new DomainError(403, "FORBIDDEN", "Only owner admins can update budget actuals.");
  }
}

export async function updateBudgetItemCommand(input: {
  actor: Actor;
  payload: BudgetItemUpdateInput;
}) {
  assertOwner(input.actor);

  const existing = await prisma.budgetItem.findUnique({
    where: { id: input.payload.itemId },
    select: { id: true }
  });

  if (!existing) {
    throw new DomainError(404, "NOT_FOUND", "Budget item not found.");
  }

  const item = await prisma.budgetItem.update({
    where: { id: input.payload.itemId },
    data: {
      actual: input.payload.actual,
      vendor: input.payload.vendor?.trim() || null,
      paidStatus: input.payload.paidStatus,
      notes: input.payload.notes?.trim() || null
    },
    include: {
      category: {
        select: {
          id: true,
          slug: true,
          title: true,
          description: true
        }
      },
      responsibleOwner: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  await logActivity({
    actorId: input.actor.id,
    type: "BUDGET_UPDATED",
    entityType: "BudgetItem",
    entityId: item.id,
    description: "Updated budget item actuals or payment status."
  });

  return serializeBudgetItem(item);
}
