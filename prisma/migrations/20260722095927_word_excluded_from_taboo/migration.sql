-- AlterTable
ALTER TABLE "words" ADD COLUMN     "excludedFromTaboo" BOOLEAN NOT NULL DEFAULT false;

-- Exclut du tirage Taboo les noms propres (dieux grecs, monuments, planètes) présents
-- dans le jeu de mots de départ. Idempotent : réappliquer n'a aucun effet de bord, et
-- WHERE ... IN ne touche que les mots réellement présents.
UPDATE "words" SET "excludedFromTaboo" = true WHERE "word" IN (
  'APHRODITE','ARTÉMIS','ARÈS','ATHÉNA','DIONYSOS','DÉMÉTER','HERMÈS','HESTIA','HÉCATE',
  'HÉPHAÏSTOS','MORPHÉE','POSÉIDON','ZEUS','ÉOLE','VÉNUS',
  'ACROPOLE','ALHAMBRA','ANGKOR','COLISÉE','KREMLIN','MACHU PICCHU','NOTRE-DAME',
  'PARTHÉNON','SAGRADA FAMILIA','STONEHENGE','TAJ MAHAL','VERSAILLES','CHARLESTON',
  'JUPITER','MARS','MERCURE','NEPTUNE','SATURNE','URANUS'
);

