import type {
  ActivityType,
  DocumentCategory,
  OpeningPriority,
  PaymentStatus,
  Priority,
  Role,
  TaskStatus,
  TimelinePhaseStatus
} from "@prisma/client";

export type AppRole = Role;
export type AppTaskStatus = TaskStatus;
export type AppPriority = Priority;
export type AppOpeningPriority = OpeningPriority;
export type AppDocumentCategory = DocumentCategory;
export type AppActivityType = ActivityType;
export type AppTimelinePhaseStatus = TimelinePhaseStatus;
export type AppPaymentStatus = PaymentStatus;
