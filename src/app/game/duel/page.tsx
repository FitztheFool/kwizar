'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDuel } from '@/hooks/useDuel';
import { isEmoji, DuelItem } from '@/lib/duel/categories';
import { ArrowLeftIcon, TrophyIcon } from '@heroicons/react/24/solid';

/** Visuel d'un item : image web, emoji, ou repli sur le nom si l'image casse. */
function ItemVisual({ item, big }: { item: DuelItem; big?: boolean }) {
    const [broken, setBroken] = useState(false);
    const emoji = isEmoji(item.img);
    const showImg = item.img && !emoji && !broken;
    return (
        <div className={`w-full ${big ? 'h-44 sm:h-56' : 'h-40 sm:h-52'} rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900`}>
            {showImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.img} alt={item.name} onError={() => setBroken(true)} className="w-full h-full object-contain p-2" loading="lazy" />
            ) : emoji ? (
                <span className="text-7xl sm:text-8xl">{item.img}</span>
            ) : (
                <span className="text-2xl sm:text-3xl font-black text-center px-3 text-zinc-700 dark:text-zinc-200">{item.name}</span>
            )}
        </div>
    );
}

export default function DuelPage() {
    const { phase, categories, category, start, choose, reset, podium, currentMatch, roundLabel } = useDuel();

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center px-4 py-6">
            {/* En-tête */}
            <div className="w-full max-w-3xl flex items-center justify-between mb-5">
                {phase === 'category'
                    ? <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"><ArrowLeftIcon className="w-4 h-4" /> Accueil</Link>
                    : <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"><ArrowLeftIcon className="w-4 h-4" /> Catégories</button>}
                <h1 className="font-black text-lg tracking-tight">Ceci ou Cela</h1>
                <span className="w-16" />
            </div>

            {/* Choix de catégorie */}
            {phase === 'category' && (
                <div className="w-full max-w-3xl">
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">Choisis une catégorie, puis élimine à chaque duel celui que tu préfères le moins.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {categories.map(c => (
                            <button key={c.id} onClick={() => start(c)}
                                className="group rounded-2xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] p-4 text-center hover:border-amber-400 hover:-translate-y-0.5 transition-all">
                                <div className="text-4xl mb-2">{c.emoji}</div>
                                <div className="font-bold text-sm">{c.title}</div>
                                <div className="text-[11px] text-gray-400 mt-1">{c.items.length} items</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

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
                                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0"><ItemVisual item={podium.finalist} /></div>
                                <span className="font-bold text-sm flex-1 truncate">{podium.finalist.name}</span>
                                <span className="text-[10px] text-gray-400 uppercase">Finaliste</span>
                            </div>
                        )}
                        {podium.semi.map((it, i) => (
                            <div key={i} className="flex items-center gap-3 rounded-xl bg-white/50 dark:bg-zinc-800/50 p-2 px-3">
                                <span className="text-lg">🥉</span>
                                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0"><ItemVisual item={it} /></div>
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
