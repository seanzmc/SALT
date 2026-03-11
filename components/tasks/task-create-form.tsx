"use client";

import { useState } from "react";
import { OpeningPriority, Priority, Role } from "@prisma/client";

import { createTaskAction } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function TaskCreateForm({
  users,
  sections,
  phases,
  currentRole
}: {
  users: Array<{ id: string; name: string; role: Role }>;
  sections: Array<{ id: string; title: string }>;
  phases: Array<{ id: string; title: string }>;
  currentRole: Role;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (currentRole !== Role.OWNER_ADMIN) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Task Creation</CardTitle>
          <CardDescription>
            Keep the checklist workspace focused until you need to add a new task.
          </CardDescription>
        </div>
        <Button onClick={() => setIsOpen((current) => !current)} type="button" variant={isOpen ? "outline" : "default"}>
          {isOpen ? "Hide form" : "New Task"}
        </Button>
      </CardHeader>
      {isOpen ? (
        <CardContent>
          <form action={createTaskAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="new-task-title">Title</Label>
              <Input id="new-task-title" name="title" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="new-task-description">Description</Label>
              <Textarea id="new-task-description" name="description" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="new-task-notes">Notes</Label>
              <Textarea id="new-task-notes" name="notes" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-task-section">Section</Label>
              <Select id="new-task-section" name="sectionId" required>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.title}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-task-phase">Phase</Label>
              <Select defaultValue="" id="new-task-phase" name="phaseId">
                <option value="">No phase</option>
                {phases.map((phase) => (
                  <option key={phase.id} value={phase.id}>
                    {phase.title}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-task-priority">Priority</Label>
              <Select defaultValue={Priority.MEDIUM} id="new-task-priority" name="priority">
                {Object.values(Priority).map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-task-opening-priority">Opening priority</Label>
              <Select
                defaultValue={OpeningPriority.MUST_HAVE_BEFORE_OPENING}
                id="new-task-opening-priority"
                name="openingPriority"
              >
                {Object.values(OpeningPriority).map((priority) => (
                  <option key={priority} value={priority}>
                    {priority.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-task-due-date">Due date</Label>
              <Input id="new-task-due-date" name="dueDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-task-assignee">Assigned to</Label>
              <Select defaultValue="" id="new-task-assignee" name="assignedToId">
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role === Role.OWNER_ADMIN ? "Owner" : "Collaborator"})
                  </option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button onClick={() => setIsOpen(false)} type="button" variant="outline">
                Cancel
              </Button>
              <Button type="submit">Create task</Button>
            </div>
          </form>
        </CardContent>
      ) : null}
    </Card>
  );
}
