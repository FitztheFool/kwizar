-- DropForeignKey
ALTER TABLE "quizzes" DROP CONSTRAINT "quizzes_categoryId_fkey";

-- AlterTable
ALTER TABLE "quizzes" ALTER COLUMN "categoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
