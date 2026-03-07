/*
  Warnings:

  - Added the required column `gameId` to the `attempts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "attempts" ADD COLUMN     "gameId" TEXT NOT NULL;
