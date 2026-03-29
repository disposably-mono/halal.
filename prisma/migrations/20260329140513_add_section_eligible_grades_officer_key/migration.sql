-- Add missing columns to existing tables

-- Add officerKey to AdminUser
ALTER TABLE "AdminUser" ADD COLUMN "officerKey" TEXT NOT NULL;

-- Add eligibleGrades to Position
ALTER TABLE "Position" ADD COLUMN "eligibleGrades" INTEGER[] DEFAULT '{}';

-- Add section to Voter
ALTER TABLE "Voter" ADD COLUMN "section" TEXT NOT NULL;

-- Update existing Voter records with default section value
UPDATE "Voter" SET "section" = 'A' WHERE "section" IS NULL;

-- Add NOT NULL constraint to section after populating
ALTER TABLE "Voter" ALTER COLUMN "section" SET NOT NULL;