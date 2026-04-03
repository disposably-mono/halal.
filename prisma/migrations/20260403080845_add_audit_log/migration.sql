-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "toStatus" "ElectionStatus",
    "adminEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;
