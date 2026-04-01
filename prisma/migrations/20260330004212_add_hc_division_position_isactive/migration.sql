-- AlterEnum
ALTER TYPE "Division" ADD VALUE 'HC';

-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
