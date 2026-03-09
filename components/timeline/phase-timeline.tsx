import { TimelinePhaseStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateTimelinePhaseAction } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

export function PhaseTimeline({
  phases
}: {
  phases: Array<{
    id: string;
    title: string;
    description: string | null;
    status: TimelinePhaseStatus;
    startDate: Date | null;
    endDate: Date | null;
    notes: string | null;
    blockers: string | null;
    milestones: Array<{ id: string; title: string; dueDate: Date | null; status: TimelinePhaseStatus }>;
    tasks: Array<{ id: string; title: string; status: string }>;
  }>;
}) {
  const earliest = phases[0]?.startDate?.getTime() ?? Date.now();
  const latest = phases[phases.length - 1]?.endDate?.getTime() ?? Date.now();
  const totalSpan = Math.max(latest - earliest, 1);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Phase Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {phases.map((phase) => {
            const start = phase.startDate?.getTime() ?? earliest;
            const end = phase.endDate?.getTime() ?? start;
            const left = ((start - earliest) / totalSpan) * 100;
            const width = Math.max(((end - start) / totalSpan) * 100, 6);

            return (
              <div key={phase.id} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{phase.title}</p>
                  <Badge
                    variant={
                      phase.status === "COMPLETE"
                        ? "success"
                        : phase.status === "BLOCKED"
                          ? "danger"
                          : phase.status === "IN_PROGRESS"
                            ? "warning"
                            : "secondary"
                    }
                  >
                    {phase.status.replaceAll("_", " ")}
                  </Badge>
                </div>
                <div className="relative h-4 rounded-full bg-muted">
                  <div
                    className="absolute top-0 h-4 rounded-full bg-primary"
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDate(phase.startDate)} to {formatDate(phase.endDate)}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {phases.map((phase) => (
          <Card key={phase.id}>
            <CardHeader>
              <CardTitle className="text-lg">{phase.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{phase.description}</p>
            </CardHeader>
            <CardContent className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Milestones</h3>
                  <div className="mt-3 space-y-2">
                    {phase.milestones.map((milestone) => (
                      <div key={milestone.id} className="rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium">{milestone.title}</p>
                          <Badge variant="outline">{milestone.status.replaceAll("_", " ")}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Due {formatDate(milestone.dueDate)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold">Linked tasks</h3>
                  <div className="mt-3 space-y-2">
                    {phase.tasks.map((task) => (
                      <div key={task.id} className="rounded-lg border border-border p-3">
                        <p className="font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.status.replaceAll("_", " ")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <form action={updateTimelinePhaseAction} className="space-y-4 rounded-xl border border-border bg-secondary/30 p-4">
                <input type="hidden" name="phaseId" value={phase.id} />
                <div className="space-y-2">
                  <Label htmlFor={`status-${phase.id}`}>Phase status</Label>
                  <Select defaultValue={phase.status} id={`status-${phase.id}`} name="status">
                    {Object.values(TimelinePhaseStatus).map((status) => (
                      <option key={status} value={status}>
                        {status.replaceAll("_", " ")}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`startDate-${phase.id}`}>Start date</Label>
                    <Input
                      defaultValue={phase.startDate ? phase.startDate.toISOString().slice(0, 10) : ""}
                      id={`startDate-${phase.id}`}
                      name="startDate"
                      type="date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`endDate-${phase.id}`}>End date</Label>
                    <Input
                      defaultValue={phase.endDate ? phase.endDate.toISOString().slice(0, 10) : ""}
                      id={`endDate-${phase.id}`}
                      name="endDate"
                      type="date"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`notes-${phase.id}`}>Notes</Label>
                  <Textarea defaultValue={phase.notes ?? ""} id={`notes-${phase.id}`} name="notes" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`blockers-${phase.id}`}>Blockers</Label>
                  <Textarea defaultValue={phase.blockers ?? ""} id={`blockers-${phase.id}`} name="blockers" />
                </div>
                <Button type="submit">Save phase</Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
