ALTER TABLE "Election"
ADD COLUMN "auditKeyEncrypted" TEXT,
ADD COLUMN "auditFingerprint" TEXT,
ADD COLUMN "auditVersion" INTEGER;

CREATE UNIQUE INDEX "Election_auditFingerprint_key" ON "Election"("auditFingerprint");

CREATE TABLE "Ballot" (
  "id" TEXT NOT NULL,
  "electionId" TEXT NOT NULL,
  "receiptHash" TEXT NOT NULL,
  "nonce" TEXT NOT NULL,
  "commitment" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "castAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Ballot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Ballot_receiptHash_key" ON "Ballot"("receiptHash");
CREATE INDEX "Ballot_electionId_idx" ON "Ballot"("electionId");

ALTER TABLE "Ballot" ADD CONSTRAINT "Ballot_electionId_fkey"
FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Vote" ADD COLUMN "ballotId" TEXT;
CREATE INDEX "Vote_ballotId_idx" ON "Vote"("ballotId");
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_ballotId_fkey"
FOREIGN KEY ("ballotId") REFERENCES "Ballot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ElectionCertification" (
  "id" TEXT NOT NULL,
  "electionId" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "snapshotHash" TEXT NOT NULL,
  "signature" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT NOT NULL,
  CONSTRAINT "ElectionCertification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ElectionCertification_electionId_key" ON "ElectionCertification"("electionId");
ALTER TABLE "ElectionCertification" ADD CONSTRAINT "ElectionCertification_electionId_fkey"
FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Recount" (
  "id" TEXT NOT NULL,
  "electionId" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "snapshotHash" TEXT NOT NULL,
  "signature" TEXT NOT NULL,
  "baselineHash" TEXT NOT NULL,
  "ballotCount" INTEGER NOT NULL,
  "validBallots" INTEGER NOT NULL,
  "invalidBallots" INTEGER NOT NULL,
  "matchesOfficial" BOOLEAN NOT NULL,
  "discrepancies" JSONB NOT NULL,
  "initiatedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Recount_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Recount_electionId_createdAt_idx" ON "Recount"("electionId", "createdAt");
ALTER TABLE "Recount" ADD CONSTRAINT "Recount_electionId_fkey"
FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;
