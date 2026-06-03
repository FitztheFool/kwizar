-- CreateTable
CREATE TABLE "word_groups" (
    "id" TEXT NOT NULL,
    "theme" TEXT NOT NULL,

    CONSTRAINT "word_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "word_groups_theme_key" ON "word_groups"("theme");

-- AlterTable
ALTER TABLE "words" ADD COLUMN "wordGroupId" TEXT;

-- AddForeignKey
ALTER TABLE "words" ADD CONSTRAINT "words_wordGroupId_fkey" FOREIGN KEY ("wordGroupId") REFERENCES "word_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
