'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useDuel } from '@/hooks/useDuel';
import { isEmoji, categoryImage, DuelItem, DuelCategory } from '@/lib/duel/types';
import { ArrowLeftIcon, TrophyIcon, PlusIcon } from '@heroicons/react/24/solid';
import { MagnifyingGlassIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';

/** Catégorie issue d'un Duel en DB (intégré ou créé par un utilisateur). */
type DeckCategory = DuelCategory & { deckId: string; ownerId: string; creatorName: string; isBuiltin: boolean };

interface DeckDTO {
    id: string;
    title: string;
    emoji: string;
    imageUrl: string | null;
    isPublic: boolean;
    isBuiltin: boolean;
    creator: { id: string; username: string };
    items: { name: string; imageUrl: string | null }[];
}

function deckToCategory(d: DeckDTO): DeckCategory {
    return {
        id: `deck:${d.id}`,
        title: d.title,
        emoji: d.emoji || '🆚',
        img: d.imageUrl ?? undefined,
        items: d.items.map((i) => ({ name: i.name, img: i.imageUrl ?? '' })),
        deckId: d.id,
        ownerId: d.creator.id,
        creatorName: d.creator.username,
        isBuiltin: d.isBuiltin,
    };
}

/** Visuel d'un item : image web, emoji, ou repli sur le nom si l'image casse.
 *  `thumb` = petite vignette (podium) : remplit le parent, image rognée. */
function ItemVisual({ item, big, thumb }: { item: DuelItem; big?: boolean; thumb?: boolean }) {
    const [broken, setBroken] = useState(false);
    const emoji = isEmoji(item.img);
    const showImg = item.img && !emoji && !broken;
    const size = thumb ? 'w-full h-full' : `w-full ${big ? 'h-44 sm:h-56' : 'h-40 sm:h-52'}`;
    return (
        <div className={`${size} rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900`}>
            {showImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.img} alt={item.name} onError={() => setBroken(true)} referrerPolicy="no-referrer"
                    className={`w-full h-full ${thumb ? 'object-cover' : 'object-contain p-2'}`} loading="lazy" />
            ) : emoji ? (
                <span className={thumb ? 'text-xl' : 'text-7xl sm:text-8xl'}>{item.img}</span>
            ) : (
                <span className={`font-black text-center text-zinc-700 dark:text-zinc-200 ${thumb ? 'text-[9px] leading-tight px-0.5' : 'text-2xl sm:text-3xl px-3'}`}>{item.name}</span>
            )}
        </div>
    );
}

/** Carte de catégorie façon TierMaker : image plein cadre + bandeau-titre noir en bas. */
function CategoryCard({ category, matchedItems, onClick, badge, onDelete, author }: {
    category: DuelCategory;
    matchedItems: string[];
    onClick: () => void;
    badge?: string;
    onDelete?: () => void;
    author?: string;
}) {
    const [broken, setBroken] = useState(false);
    const src = categoryImage(category);
    return (
        <button
            onClick={onClick}
            className="group relative aspect-[4/3] overflow-hidden rounded-md bg-zinc-800 ring-1 ring-white/5 transition-all hover:ring-2 hover:ring-amber-400 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
            title={category.title}
        >
            {src && !broken ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={category.title} onError={() => setBroken(true)} referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy" />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center text-5xl bg-gradient-to-br from-zinc-700 to-zinc-900">
                    {category.emoji}
                </div>
            )}

            {badge && (
                <span className="absolute top-1.5 left-1.5 rounded bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">
                    {badge}
                </span>
            )}
            {onDelete && (
                <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onDelete(); } }}
                    className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded bg-black/60 text-gray-300 hover:bg-red-600 hover:text-white"
                    title="Supprimer"
                >
                    <TrashIcon className="h-3.5 w-3.5" />
                </span>
            )}

            {/* Bandeau-titre noir en bas, comme TierMaker */}
            <div className="absolute inset-x-0 bottom-0 bg-black/85 px-2 py-2 text-center">
                <div className="text-sm font-bold text-white leading-tight truncate">{category.title}</div>
                {matchedItems.length > 0 ? (
                    <div className="text-[10px] text-amber-400 truncate" title={matchedItems.join(', ')}>
                        ✓ {matchedItems.slice(0, 3).join(', ')}{matchedItems.length > 3 ? `, +${matchedItems.length - 3}` : ''}
                    </div>
                ) : (
                    <div className="text-[10px] text-gray-400">{category.items.length} items</div>
                )}
                {author && (
                    <div className="text-[10px] text-gray-400 truncate" title={`Créé par ${author}`}>
                        créé par <span className="text-gray-300 font-semibold">{author}</span>
                    </div>
                )}
            </div>
        </button>
    );
}

export default function DuelPage() {
    const { phase, category, start, choose, reset, podium, currentMatch, roundLabel } = useDuel();
    const { data: session } = useSession();
    const [query, setQuery] = useState('');
    const [decks, setDecks] = useState<DeckCategory[]>([]);

    const loadDecks = useCallback(async () => {
        try {
            const res = await fetch('/api/duel');
            if (!res.ok) return;
            const data = await res.json();
            setDecks(((data.decks ?? []) as DeckDTO[]).map(deckToCategory));
        } catch { /* hors-ligne : rien à afficher */ }
    }, []);
    useEffect(() => { loadDecks(); }, [loadDecks]);

    const handleDelete = useCallback(async (deckId: string) => {
        if (!confirm('Supprimer ce Duel ?')) return;
        const res = await fetch(`/api/duel/${deckId}`, { method: 'DELETE' });
        if (res.ok) setDecks(d => d.filter(c => c.deckId !== deckId));
    }, []);

    // Tout vient de la DB : Duels intégrés (isBuiltin) + créations des utilisateurs.
    const allCategories = useMemo<DuelCategory[]>(() => decks, [decks]);

    // Recherche : on garde une catégorie si son titre OU l'un de ses items correspond.
    // Pour chaque résultat, on retient les items qui matchent (affichés en aperçu).
    const q = query.trim().toLowerCase();
    const filtered = useMemo(() => {
        if (!q) return allCategories.map(c => ({ category: c, matchedItems: [] as string[] }));
        return allCategories
            .map(c => {
                const titleMatch = c.title.toLowerCase().includes(q);
                const matchedItems = c.items.filter(i => i.name.toLowerCase().includes(q)).map(i => i.name);
                return { category: c, matchedItems, keep: titleMatch || matchedItems.length > 0 };
            })
            .filter(r => r.keep)
            .map(({ category, matchedItems }) => ({ category, matchedItems }));
    }, [allCategories, q]);

    // Phase « catégorie » : page sombre type TierMaker, pleine largeur.
    if (phase === 'category') {
        return (
            <div className="min-h-screen bg-zinc-900 text-white px-4 sm:px-8 py-8">
                <div className="mx-auto max-w-6xl">
                    <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-6">
                        <ArrowLeftIcon className="w-4 h-4" /> Accueil
                    </Link>

                    {/* Titre type « Create a Tier List for Anything » */}
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3">Crée un Duel sur n&apos;importe quoi</h1>
                    <p className="text-gray-400 max-w-2xl mb-8">
                        Choisis une catégorie, puis élimine à chaque duel l&apos;item que tu préfères le moins
                        jusqu&apos;à désigner ton favori.
                    </p>

                    {/* Recherche : par nom de catégorie ou par item (ex. « Pikachu ») */}
                    <div className="relative max-w-xl mb-8">
                        <MagnifyingGlassIcon className="absolute inset-y-0 left-3 my-auto w-5 h-5 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Rechercher une catégorie ou un item…"
                            className="w-full pl-10 pr-10 py-3 text-sm rounded-lg border border-white/10 bg-zinc-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className="absolute inset-y-0 right-2 my-auto flex items-center justify-center w-7 h-7 text-gray-400 hover:text-white"
                                title="Effacer"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold">
                            Catégories <span className="text-gray-500 font-normal text-sm">· {filtered.length}</span>
                        </h2>
                        <Link
                            href="/game/duel/create"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-white hover:bg-amber-400"
                        >
                            <PlusIcon className="w-4 h-4" /> Créer le mien
                        </Link>
                    </div>

                    {filtered.length === 0 ? (
                        <p className="py-16 text-sm text-center text-gray-500">
                            Aucune catégorie ne correspond à « {query} ».
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {filtered.map(({ category: c, matchedItems }) => {
                                const deck = c as Partial<DeckCategory>;
                                const isUserDeck = !!deck.deckId && !deck.isBuiltin;
                                const canDelete = isUserDeck && !!session?.user?.id && deck.ownerId === session.user.id;
                                return (
                                    <CategoryCard
                                        key={c.id}
                                        category={c}
                                        matchedItems={matchedItems}
                                        onClick={() => start(c)}
                                        badge={isUserDeck ? 'Custom' : undefined}
                                        onDelete={canDelete ? () => handleDelete(deck.deckId!) : undefined}
                                        author={deck.creatorName}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center px-4 py-6">
            {/* En-tête */}
            <div className="w-full max-w-3xl flex items-center justify-between mb-5">
                <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"><ArrowLeftIcon className="w-4 h-4" /> Catégories</button>
                <h1 className="font-black text-lg tracking-tight">Duel</h1>
                <span className="w-16" />
            </div>

            {/* Duel */}
            {phase === 'duel' && currentMatch && category && (
                <div className="w-full max-w-3xl flex flex-col items-center gap-4">
                    <div className="text-center">
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-500">{roundLabel}</p>
                        <h2 className="text-xl font-black">{category.title} ?</h2>
                        <p className="text-xs text-gray-400 mt-1">Clique sur celui que tu préfères</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:gap-5 w-full">
                        {currentMatch.map((item, i) => (
                            <button key={i} onClick={() => choose(item)}
                                className="rounded-2xl border-2 border-transparent hover:border-amber-400 bg-white/70 dark:bg-zinc-800/70 p-3 transition-all hover:-translate-y-1 active:scale-95 shadow-md">
                                <ItemVisual item={item} big />
                                <div className="mt-2 font-black text-center text-sm sm:text-base">{item.name}</div>
                            </button>
                        ))}
                    </div>
                    <div className="text-center text-2xl font-black text-amber-500/60">VS</div>
                </div>
            )}

            {/* Podium */}
            {phase === 'podium' && podium && category && (
                <div className="w-full max-w-md flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 text-amber-500"><TrophyIcon className="w-7 h-7" /><span className="font-black text-lg">Ton podium · {category.title}</span></div>

                    {/* Gagnant */}
                    <div className="w-full rounded-2xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-900/20 p-4 text-center">
                        <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">🥇 Gagnant</span>
                        <div className="mt-2"><ItemVisual item={podium.winner} big /></div>
                        <div className="mt-2 font-black text-lg">{podium.winner.name}</div>
                    </div>

                    {/* Finaliste + demi-finalistes */}
                    <div className="w-full grid grid-cols-1 gap-2">
                        {podium.finalist && (
                            <div className="flex items-center gap-3 rounded-xl bg-white/70 dark:bg-zinc-800/70 p-2 px-3">
                                <span className="text-lg">🥈</span>
                                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0"><ItemVisual item={podium.finalist} thumb /></div>
                                <span className="font-bold text-sm flex-1 truncate">{podium.finalist.name}</span>
                                <span className="text-[10px] text-gray-400 uppercase">Finaliste</span>
                            </div>
                        )}
                        {podium.semi.map((it, i) => (
                            <div key={i} className="flex items-center gap-3 rounded-xl bg-white/50 dark:bg-zinc-800/50 p-2 px-3">
                                <span className="text-lg">🥉</span>
                                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0"><ItemVisual item={it} thumb /></div>
                                <span className="font-bold text-sm flex-1 truncate">{it.name}</span>
                                <span className="text-[10px] text-gray-400 uppercase">Demi-finale</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2 w-full mt-1">
                        <button onClick={() => start(category)} className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm">Rejouer</button>
                        <button onClick={reset} className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 font-semibold text-sm">Autre catégorie</button>
                    </div>
                </div>
            )}
        </div>
    );
}
