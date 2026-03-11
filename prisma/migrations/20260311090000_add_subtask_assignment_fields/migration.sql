ALTER TABLE "Subtask"
ADD COLUMN "assignedToId" TEXT,
ADD COLUMN "dueDate" TIMESTAMP(3);

CREATE INDEX "Subtask_assignedToId_idx" ON "Subtask"("assignedToId");

ALTER TABLE "Subtask"
ADD CONSTRAINT "Subtask_assignedToId_fkey"
FOREIGN KEY ("assignedToId") REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
