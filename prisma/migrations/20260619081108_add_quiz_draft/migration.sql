-- AlterTable
ALTER TABLE "quizzes" ADD COLUMN     "isDraft" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "quizzes_isDraft_idx" ON "quizzes"("isDraft");
