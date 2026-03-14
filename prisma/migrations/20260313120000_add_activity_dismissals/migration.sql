-- CreateTable
CREATE TABLE "ActivityDismissal" (
    "activityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityDismissal_pkey" PRIMARY KEY ("activityId","userId")
);

-- CreateIndex
CREATE INDEX "ActivityDismissal_userId_dismissedAt_idx" ON "ActivityDismissal"("userId", "dismissedAt");

-- AddForeignKey
ALTER TABLE "ActivityDismissal" ADD CONSTRAINT "ActivityDismissal_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ActivityLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityDismissal" ADD CONSTRAINT "ActivityDismissal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
