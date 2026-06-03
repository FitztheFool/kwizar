/*
  Warnings:

  - You are about to drop the column `activatedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "activatedAt",
DROP COLUMN "emailVerified",
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3);
