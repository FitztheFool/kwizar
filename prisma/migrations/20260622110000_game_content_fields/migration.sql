-- Champs d'override de contenu par jeu (admin). Idempotent (IF NOT EXISTS) car selon
-- l'historique des migrations, ces colonnes peuvent déjà exister sur certaines bases.
ALTER TABLE "game_settings"
  ADD COLUMN IF NOT EXISTS "coverUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "rules" TEXT,
  ADD COLUMN IF NOT EXISTS "score" TEXT,
  ADD COLUMN IF NOT EXISTS "players" TEXT,
  ADD COLUMN IF NOT EXISTS "scoreLabel" TEXT;
