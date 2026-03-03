-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ANONYMOUS';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isAnonymous" BOOLEAN NOT NULL DEFAULT false;
