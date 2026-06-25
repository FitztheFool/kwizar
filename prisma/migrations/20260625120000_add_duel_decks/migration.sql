-- "Ceci ou Cela" (Duel) créés par les utilisateurs.
CREATE TABLE IF NOT EXISTS "duel_decks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🆚',
    "imageUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" TEXT NOT NULL,
    CONSTRAINT "duel_decks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "duel_deck_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "deckId" TEXT NOT NULL,
    CONSTRAINT "duel_deck_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "duel_decks_creatorId_idx" ON "duel_decks"("creatorId");
CREATE INDEX IF NOT EXISTS "duel_decks_isPublic_idx" ON "duel_decks"("isPublic");
CREATE INDEX IF NOT EXISTS "duel_deck_items_deckId_idx" ON "duel_deck_items"("deckId");

ALTER TABLE "duel_decks" ADD CONSTRAINT "duel_decks_creatorId_fkey"
    FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "duel_deck_items" ADD CONSTRAINT "duel_deck_items_deckId_fkey"
    FOREIGN KEY ("deckId") REFERENCES "duel_decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
