-- CreateTable
CREATE TABLE "AdminAccountLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetEmail" TEXT NOT NULL,
    "targetName" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAccountLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminAccountLog_createdAt_idx" ON "AdminAccountLog"("createdAt");
