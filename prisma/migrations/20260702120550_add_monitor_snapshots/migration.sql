-- CreateTable
CREATE TABLE "MonitorSnapshot" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "bucket" INTEGER NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,

    CONSTRAINT "MonitorSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonitorSnapshot_electionId_capturedAt_idx" ON "MonitorSnapshot"("electionId", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MonitorSnapshot_electionId_bucket_key" ON "MonitorSnapshot"("electionId", "bucket");

-- AddForeignKey
ALTER TABLE "MonitorSnapshot" ADD CONSTRAINT "MonitorSnapshot_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;
