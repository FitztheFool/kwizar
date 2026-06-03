-- CreateTable
CREATE TABLE "lobby_invites" (
    "id" TEXT NOT NULL,
    "lobbyId" TEXT NOT NULL,
    "gameType" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lobby_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lobby_invites_toUserId_createdAt_idx" ON "lobby_invites"("toUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "lobby_invites_toUserId_lobbyId_key" ON "lobby_invites"("toUserId", "lobbyId");

-- AddForeignKey
ALTER TABLE "lobby_invites" ADD CONSTRAINT "lobby_invites_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lobby_invites" ADD CONSTRAINT "lobby_invites_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
