-- CreateTable
CREATE TABLE "AdminLoginHistory" (
    "id" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "officerName" TEXT NOT NULL,
    "officerEmail" TEXT NOT NULL,
    "verifierId" TEXT NOT NULL,
    "verifierName" TEXT NOT NULL,
    "verifierEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLoginHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminLoginHistory_createdAt_idx" ON "AdminLoginHistory"("createdAt");
