import type { BudgetItemRecord, BudgetWorkspaceData } from "@salt/types";

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null;
}

export function serializeBudgetItem(item: {
  id: string;
  lineItem: string;
  priority: BudgetItemRecord["priority"];
  openingPriority: BudgetItemRecord["openingPriority"];
  estimate: unknown;
  actual: unknown;
  vendor: string | null;
  depositDue: Date | null;
  leadTimeDays: number | null;
  responsibleOwner: {
    id: string;
    name: string;
  } | null;
  notes: string | null;
  paidStatus: BudgetItemRecord["paidStatus"];
  isPdfPlaceholder: boolean;
  updatedAt: Date;
  category: BudgetItemRecord["category"];
}): BudgetItemRecord {
  const estimate = Number(item.estimate);
  const actual = Number(item.actual);

  return {
    id: item.id,
    lineItem: item.lineItem,
    priority: item.priority,
    openingPriority: item.openingPriority,
    estimate,
    actual,
    variance: actual - estimate,
    vendor: item.vendor,
    depositDue: toIsoString(item.depositDue),
    leadTimeDays: item.leadTimeDays,
    responsibleOwner: item.responsibleOwner,
    notes: item.notes,
    paidStatus: item.paidStatus,
    isPdfPlaceholder: item.isPdfPlaceholder,
    updatedAt: item.updatedAt.toISOString(),
    category: item.category
  };
}

export function serializeBudgetWorkspace(input: {
  categories: BudgetWorkspaceData["categories"];
  items: Parameters<typeof serializeBudgetItem>[0][];
}): BudgetWorkspaceData {
  const items = input.items.map(serializeBudgetItem);
  const totals = items.reduce(
    (acc, item) => {
      acc.estimated += item.estimate;
      acc.actual += item.actual;

      if (item.openingPriority === "MUST_HAVE_BEFORE_OPENING") {
        acc.mustHave += item.estimate;
      } else {
        acc.optional += item.estimate;
      }

      return acc;
    },
    {
      estimated: 0,
      actual: 0,
      variance: 0,
      mustHave: 0,
      optional: 0
    }
  );

  totals.variance = totals.actual - totals.estimated;

  return {
    categories: input.categories,
    items,
    totals
  };
}
