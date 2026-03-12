import { z } from "zod";

import { TIMELINE_PHASE_STATUS_VALUES } from "@salt/types";

export const timelinePhaseIdParamSchema = z.object({
  phaseId: z.string().cuid()
});

export const timelinePhaseUpdateSchema = z.object({
  phaseId: z.string().cuid(),
  status: z.enum(TIMELINE_PHASE_STATUS_VALUES),
  notes: z.string().max(2000).optional().or(z.literal("")),
  blockers: z.string().max(1000).optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal(""))
});
