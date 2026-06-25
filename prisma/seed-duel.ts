// prisma/seed-duel.ts
// Seede les Duels intégrés (catégories "Ceci ou Cela" de base) en DB, à partir
// de la source de vérité src/lib/duel/categories.ts. Idempotent : upsert par id
// stable `builtin_<cat.id>` + remplacement des items. Réutilisable depuis
// seedShared (seed dev/prod) ou en standalone (seed-duel-run.ts).
import type { PrismaClient } from '../src/generated/prisma/client';
import { CATEGORIES, isEmoji } from '../src/lib/duel/categories';

export async function seedDuelDecks(prisma: PrismaClient, ownerId: string) {
    for (const cat of CATEGORIES) {
        const id = `builtin_${cat.id}`;
        const items = cat.items.map((it, i) => ({
            name: it.name,
            imageUrl: isEmoji(it.img) ? null : (it.img || null),
            position: i,
        }));
        const base = {
            title: cat.title,
            emoji: cat.emoji,
            imageUrl: cat.img ?? null,
            isPublic: true,
            isBuiltin: true,
            creatorId: ownerId,
        };
        await prisma.duelDeck.upsert({
            where: { id },
            create: { id, ...base, items: { create: items } },
            update: { ...base, items: { deleteMany: {}, create: items } },
        });
    }
    console.log(`✅ ${CATEGORIES.length} Duels intégrés seedés`);
}
