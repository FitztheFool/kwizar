-- Retrait du champ emoji des Duels : le repli visuel utilise désormais l'initiale du titre.
ALTER TABLE "duel_decks" DROP COLUMN IF EXISTS "emoji";
