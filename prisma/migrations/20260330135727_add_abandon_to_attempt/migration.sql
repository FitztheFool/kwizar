/*
  Warnings:

  - Made the column `categoryId` on table `quizzes` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "quizzes" DROP CONSTRAINT "quizzes_categoryId_fkey";

-- AlterTable
ALTER TABLE "attempts" ADD COLUMN     "abandon" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "afk" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "oauth_pending" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "quizzes" ALTER COLUMN "categoryId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
