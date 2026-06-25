// Types et helpers du jeu "Duel" — partagés client + serveur.
// La donnée des catégories intégrées vit dans ./categories (serveur/seed uniquement).

export interface DuelItem { name: string; img: string; }
export interface DuelCategory { id: string; title: string; emoji: string; img?: string; items: DuelItem[]; }

export const isEmoji = (img: string) => !!img && !img.startsWith('http');

/** Image d'icône d'une catégorie : champ `img` explicite, sinon 1ʳᵉ image d'item utilisable. */
export function categoryImage(c: DuelCategory): string | null {
    if (c.img && !isEmoji(c.img)) return c.img;
    const item = c.items.find(i => i.img && !isEmoji(i.img));
    return item ? item.img : null;
}
