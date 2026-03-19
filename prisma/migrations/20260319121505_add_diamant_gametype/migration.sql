/*
  Warnings:

  - A unique constraint covering the columns `[userId,gameId]` on the table `attempts` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "GameType" ADD VALUE 'DIAMANT';

-- CreateIndex
CREATE UNIQUE INDEX "attempts_userId_gameId_key" ON "attempts"("userId", "gameId");
