'use client';

import { useMemo, useState } from 'react';
import { evaluateAchievements, type AchievementStats, type AchievementTier } from '@/lib/achievements';

// Couleur par palier — appliquée seulement quand le succès est débloqué. Verrouillé = gris.
const TIER_RING: Record<AchievementTier, string> = {
    bronze: 'ring-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300',
    silver: 'ring-slate-400/40 bg-slate-400/10 text-slate-600 dark:text-slate-300',
    gold: 'ring-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-300',
};

const TIER_BAR: Record<AchievementTier, string> = {
    bronze: 'bg-amber-500',
    silver: 'bg-slate-400',
    gold: 'bg-yellow-500',
};

interface Props {
    stats: AchievementStats;
}

/** Galerie de succès — débloqués en tête, puis les plus proches, avec barre de progression. */
export default function AchievementGallery({ stats }: Props) {
    const all = useMemo(() => evaluateAchievements(stats), [stats]);
    const unlockedCount = all.filter(a => a.unlocked).length;
    const [showAll, setShowAll] = useState(false);

    // Par défaut : les débloqués + les 4 plus proches. « Voir tout » déplie le reste.
    const visible = showAll ? all : all.filter((a, i) => a.unlocked || i < unlockedCount + 4);

    return (
        <div className="glass rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>🏆</span> Succès
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 tabular-nums">
                        {unlockedCount}/{all.length}
                    </span>
                </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {visible.map(a => {
                    const pct = Math.round(a.ratio * 100);
                    return (
                        <div
                            key={a.id}
                            className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${a.unlocked
                                ? 'border-black/5 dark:border-white/10'
                                : 'border-black/5 dark:border-white/5 opacity-70'}`}
                        >
                            <div
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ring-1 ${a.unlocked
                                    ? TIER_RING[a.tier]
                                    : 'bg-gray-100 dark:bg-white/5 ring-black/5 dark:ring-white/10 grayscale'}`}
                            >
                                {a.unlocked ? a.icon : '🔒'}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-baseline justify-between gap-2">
                                    <p className={`text-sm font-bold truncate ${a.unlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {a.label}
                                    </p>
                                    {!a.unlocked && (
                                        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 tabular-nums shrink-0">
                                            {a.current.toLocaleString('fr-FR')}/{a.target.toLocaleString('fr-FR')}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{a.description}</p>

                                {!a.unlocked && (
                                    <div className="mt-1.5 h-1 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                                        <div className={`h-full rounded-full ${TIER_BAR[a.tier]} transition-[width] duration-500`} style={{ width: `${pct}%` }} />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {!showAll && visible.length < all.length && (
                <button
                    onClick={() => setShowAll(true)}
                    className="mt-3 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                >
                    Voir tout ({all.length - visible.length} de plus) ↓
                </button>
            )}
        </div>
    );
}
