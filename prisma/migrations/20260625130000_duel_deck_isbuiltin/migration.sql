-- Distingue les Duels intégrés (seedés) des Duels créés par les utilisateurs.
ALTER TABLE "duel_decks" ADD COLUMN IF NOT EXISTS "isBuiltin" BOOLEAN NOT NULL DEFAULT false;
