-- CreateTable
CREATE TABLE "game_settings" (
    "gameType" "GameType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_settings_pkey" PRIMARY KEY ("gameType")
);
