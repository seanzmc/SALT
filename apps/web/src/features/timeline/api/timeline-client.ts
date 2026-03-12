import type {
  TimelinePhaseRecord,
  TimelinePhaseUpdateInput,
  TimelineWorkspaceData
} from "@salt/types";

import { apiClient } from "../../../lib/api-client";

export function getTimelineWorkspace() {
  return apiClient<TimelineWorkspaceData>("/api/timeline/phases", {
    method: "GET"
  });
}

export function updateTimelinePhase(payload: TimelinePhaseUpdateInput) {
  return apiClient<TimelinePhaseRecord>(`/api/timeline/phases/${payload.phaseId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}
