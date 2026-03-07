-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('QUIZ', 'UNO');

-- AlterTable
ALTER TABLE "attempts" ADD COLUMN     "gameType" "GameType" NOT NULL DEFAULT 'QUIZ',
ADD COLUMN     "placement" INTEGER,
ALTER COLUMN "quizId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "attempts_userId_gameType_idx" ON "attempts"("userId", "gameType");
