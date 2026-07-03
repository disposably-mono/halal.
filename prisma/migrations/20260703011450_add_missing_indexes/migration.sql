-- CreateIndex
CREATE INDEX "AuditLog_electionId_createdAt_idx" ON "AuditLog"("electionId", "createdAt");

-- CreateIndex
CREATE INDEX "Candidate_positionId_idx" ON "Candidate"("positionId");

-- CreateIndex
CREATE INDEX "Candidate_electionId_idx" ON "Candidate"("electionId");

-- CreateIndex
CREATE INDEX "Position_electionId_isActive_idx" ON "Position"("electionId", "isActive");

-- CreateIndex
CREATE INDEX "Vote_candidateId_idx" ON "Vote"("candidateId");

-- CreateIndex
CREATE INDEX "Voter_gradeLevel_section_idx" ON "Voter"("gradeLevel", "section");

-- CreateIndex
CREATE INDEX "Voter_studentId_idx" ON "Voter"("studentId");
