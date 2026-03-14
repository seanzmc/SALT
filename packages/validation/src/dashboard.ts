import { z } from "zod";

export const dashboardActivityDismissSchema = z.object({
  activityId: z.string().cuid()
});
