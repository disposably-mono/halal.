/*
  Warnings:

  - Changed the type of `gradeLevel` on the `Candidate` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Candidate" DROP COLUMN "gradeLevel",
ADD COLUMN     "gradeLevel" INTEGER NOT NULL;
