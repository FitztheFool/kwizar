-- AlterTable
ALTER TABLE "attempts" ADD COLUMN     "eloAfter" INTEGER,
ADD COLUMN     "eloBefore" INTEGER,
ADD COLUMN     "eloDelta" INTEGER;

-- CreateTable
CREATE TABLE "game_ratings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameType" "GameType" NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 1000,
    "games" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "peak" INTEGER NOT NULL DEFAULT 1000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "game_ratings_gameType_rating_idx" ON "game_ratings"("gameType", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "game_ratings_userId_gameType_key" ON "game_ratings"("userId", "gameType");

-- AddForeignKey
ALTER TABLE "game_ratings" ADD CONSTRAINT "game_ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
