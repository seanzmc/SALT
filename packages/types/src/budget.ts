import type { TaskOpeningPriority, TaskPriority } from "./tasks.js";

export const PAYMENT_STATUS_VALUES = [
  "NOT_PAID",
  "DEPOSIT_DUE",
  "PARTIALLY_PAID",
  "PAID"
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUS_VALUES)[number];

export type BudgetCategoryRecord = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
};

export type BudgetItemRecord = {
  id: string;
  lineItem: string;
  priority: TaskPriority;
  openingPriority: TaskOpeningPriority;
  estimate: number;
  actual: number;
  variance: number;
  vendor: string | null;
  depositDue: string | null;
  leadTimeDays: number | null;
  responsibleOwner: {
    id: string;
    name: string;
  } | null;
  notes: string | null;
  paidStatus: PaymentStatus;
  isPdfPlaceholder: boolean;
  category: BudgetCategoryRecord;
  updatedAt: string;
};

export type BudgetTotals = {
  estimated: number;
  actual: number;
  variance: number;
  mustHave: number;
  optional: number;
};

export type BudgetListFilters = {
  category?: string;
};

export type BudgetWorkspaceData = {
  categories: BudgetCategoryRecord[];
  items: BudgetItemRecord[];
  totals: BudgetTotals;
};

export type BudgetItemUpdateInput = {
  itemId: string;
  actual: number;
  vendor: string | null;
  paidStatus: PaymentStatus;
  notes: string | null;
};
