/*
  Warnings:

  - You are about to drop the column `name` on the `Voter` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "candidateGrade" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Voter" DROP COLUMN "name";
