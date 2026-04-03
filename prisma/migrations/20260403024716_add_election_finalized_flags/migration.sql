-- AlterTable
ALTER TABLE "Election" ADD COLUMN     "candidatesFinalized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "votersFinalized" BOOLEAN NOT NULL DEFAULT false;
