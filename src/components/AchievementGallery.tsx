'use client';

import { useMemo, useState } from 'react';
import { LockClosedIcon, TrophyIcon } from '@heroicons/react/24/solid';
import { evaluateAchievements, type AchievementStats, type AchievementTier } from '@/lib/achievements';
import { achievementIcon } from '@/components/achievementIcons';

// Couleur par PALIER (bronze/argent/or) — appliquée seulement quand le succès est
// débloqué : la teinte récompense le niveau atteint, pas la progression en cours.
//
// Les trois teintes sont volontairement écartées en TON, pas seulement en luminosité :
// le bronze tire vers le cuivre rouge (orange-700), l'or reste jaune franc et lumineux
// (amber-300 en sombre). Un ambre foncé et un jaune vif se confondaient sur fond noir.
const TIER_RING: Record<AchievementTier, string> = {
    bronze: 'ring-orange-700/50 bg-orange-800/15 text-orange-700 dark:text-orange-400',
    silver: 'ring-slate-300/40 bg-slate-300/10 text-slate-500 dark:text-slate-200',
    gold: 'ring-amber-400/70 bg-amber-400/20 text-amber-500 dark:text-amber-300 shadow-[0_0_12px_-2px_rgba(251,191,36,0.45)]',
};

/** Bordure de carte teintée : l'or doit se repérer sans lire la pastille. */
const TIER_CARD: Record<AchievementTier, string> = {
    bronze: 'border-orange-800/25 dark:border-orange-500/20',
    silver: 'border-slate-400/25 dark:border-slate-300/15',
    gold: 'border-amber-400/40 dark:border-amber-300/30',
};

/** Pastille de palier : la couleur seule ne suffit pas (daltonisme, petits écrans). */
const TIER_BADGE: Record<AchievementTier, { label: string; className: string }> = {
    bronze: { label: 'Bronze', className: 'text-orange-700 dark:text-orange-400/90' },
    silver: { label: 'Argent', className: 'text-slate-500 dark:text-slate-300/90' },
    gold: { label: 'Or', className: 'text-amber-600 dark:text-amber-300/90' },
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
                    <TrophyIcon className="h-4 w-4 text-yellow-500" aria-hidden />
                    Succès
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 tabular-nums">
                        {unlockedCount}/{all.length}
                    </span>
                </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {visible.map(a => {
                    const pct = Math.round(a.ratio * 100);
                    const Icon = achievementIcon(a.id);
                    return (
                        <div
                            key={a.id}
                            className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${a.unlocked
                                ? TIER_CARD[a.tier]
                                : 'border-black/5 dark:border-white/5 opacity-70'}`}
                        >
                            <div
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${a.unlocked
                                    ? TIER_RING[a.tier]
                                    : 'bg-gray-100 dark:bg-white/5 ring-black/5 dark:ring-white/10 text-gray-400 dark:text-gray-500'}`}
                            >
                                {a.unlocked
                                    ? <Icon className="h-6 w-6" aria-hidden />
                                    : <LockClosedIcon className="h-5 w-5" aria-hidden />}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-baseline justify-between gap-2">
                                    <p className={`text-sm font-bold truncate ${a.unlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {a.label}
                                    </p>
                                    {a.unlocked ? (
                                        <span className={`text-[10px] font-bold uppercase tracking-wide shrink-0 ${TIER_BADGE[a.tier].className}`}>
                                            {TIER_BADGE[a.tier].label}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 tabular-nums shrink-0">
                                            {a.current.toLocaleString('fr-FR')}/{a.target.toLocaleString('fr-FR')}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{a.description}</p>

                                {/* Verrouillé = barre neutre pour tous les paliers : la couleur ne doit
                                    signaler que le déblocage, jamais le palier d'un succès non obtenu. */}
                                {!a.unlocked && (
                                    <div className="mt-1.5 h-1 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gray-400 dark:bg-gray-500 transition-[width] duration-500"
                                            style={{ width: `${pct}%` }}
                                        />
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
