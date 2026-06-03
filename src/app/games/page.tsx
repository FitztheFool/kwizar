import Link from 'next/link';
import {
    ArrowRightIcon,
    RectangleGroupIcon,
    SparklesIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';

import GameCard from '@/components/GameCard';
import { GAME_CONFIG, type GameMode } from '@/lib/gameConfig';

const MODE_LABELS: Record<GameMode, string> = {
    solo: 'Solo',
    both: 'Solo / multi',
    multi: 'Multi only',
};

const MODE_DESCRIPTIONS: Record<GameMode, string> = {
    solo: 'Jeux rapides, jouables seul, sans attendre une table.',
    both: 'Jeux hybrides : seul pour s’entraîner, à plusieurs pour la vraie table.',
    multi: 'Jeux construits pour la discussion, le bluff, la coopération ou l’affrontement.',
};

const MODE_ORDER: GameMode[] = ['solo', 'both', 'multi'];

const MODE_META: Record<GameMode, { kicker: string; border: string; accent: string }> = {
    solo: {
        kicker: 'Coin calme',
        border: 'border-[#D8C6AC]',
        accent: 'bg-[#9E3A2F]',
    },
    both: {
        kicker: 'Table flexible',
        border: 'border-[#C58B2B]/50',
        accent: 'bg-[#C58B2B]',
    },
    multi: {
        kicker: 'Grande table',
        border: 'border-[#1F5B45]/40',
        accent: 'bg-[#1F5B45]',
    },
};

export default function GamesPage() {
    const gamesByMode = MODE_ORDER.reduce((acc, mode) => {
        acc[mode] = Object.entries(GAME_CONFIG).filter(([, config]) => config.mode === mode);
        return acc;
    }, {} as Record<GameMode, [string, typeof GAME_CONFIG[keyof typeof GAME_CONFIG]][]>);

    const totalGames = Object.keys(GAME_CONFIG).length;

    return (
        <main className="min-h-screen bg-[#F7F1E7] text-[#251C15]">
            <section className="relative overflow-hidden border-b border-[#D8C6AC] bg-[#F7F1E7]">
                <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_18%_18%,rgba(197,139,43,0.18),transparent_26%),radial-gradient(circle_at_84%_22%,rgba(31,91,69,0.14),transparent_24%),linear-gradient(90deg,rgba(226,211,190,0.42)_1px,transparent_1px),linear-gradient(rgba(226,211,190,0.42)_1px,transparent_1px)] [background-size:auto,auto,44px_44px,44px_44px]" />

                <div className="relative mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
                    <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
                        <div>
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D8C6AC] bg-[#FFFCF5]/80 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#6B4308] shadow-sm">
                                <RectangleGroupIcon className="h-4 w-4" />
                                Catalogue complet
                            </div>

                            <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.02] tracking-tight text-[#251C15] md:text-6xl">
                                Tous les jeux, rangés comme une ludothèque.
                            </h1>

                            <p className="mt-5 max-w-2xl text-base leading-7 text-[#766A5D] md:text-lg">
                                Le catalogue est séparé des lobbies. Les jeux sont classés par usage pour éviter de mélanger les expériences solo et les tables multijoueurs.
                            </p>

                            <div className="mt-7 flex flex-wrap gap-3">
                                <Link
                                    href="/lobby/all"
                                    className="inline-flex items-center gap-2 rounded-full bg-[#1F5B45] px-5 py-3 text-sm font-black text-[#FFF8E8] shadow-[0_12px_28px_rgba(31,91,69,0.24)] transition-all hover:bg-[#174735]"
                                >
                                    <UsersIcon className="h-4 w-4" />
                                    Voir les tables ouvertes
                                </Link>
                            </div>
                        </div>

                        <div className="rounded-[28px] border border-[#E3D3BB] bg-[#FFFCF5]/78 p-5 shadow-[0_16px_42px_rgba(43,31,20,0.07)] backdrop-blur-sm">
                            <div className="text-xs font-black uppercase tracking-[0.2em] text-[#8B7C6A]">Ludothèque</div>
                            <div className="mt-2 font-display text-5xl font-bold text-[#1F5B45]">{totalGames}</div>
                            <p className="mt-2 text-sm leading-6 text-[#766A5D]">
                                Jeux disponibles, divisés en trois rayons : solo, hybride et table multijoueur.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12">
                <div className="space-y-8">
                    {MODE_ORDER.map((mode) => {
                        const games = gamesByMode[mode];
                        if (!games.length) return null;
                        const meta = MODE_META[mode];

                        return (
                            <fieldset
                                key={mode}
                                className={`relative rounded-[32px] border ${meta.border} bg-[#FFFCF5] p-4 shadow-[0_16px_42px_rgba(43,31,20,0.06)] md:p-6`}
                            >
                                <div className={`absolute left-0 top-8 h-16 w-2 rounded-r-full ${meta.accent}`} />

                                <legend className="px-3">
                                    <div className="rounded-[24px] border border-[#E3D3BB] bg-[#F8EEDB] px-5 py-3 shadow-sm">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="inline-flex items-center gap-2 rounded-full bg-[#FFFCF5] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#6B4308]">
                                                <SparklesIcon className="h-3.5 w-3.5" />
                                                {meta.kicker}
                                            </span>
                                            <span className="text-xs font-black uppercase tracking-[0.16em] text-[#8B7C6A]">
                                                {games.length} jeu{games.length > 1 ? 'x' : ''}
                                            </span>
                                        </div>

                                        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-[#251C15] md:text-3xl">
                                            {MODE_LABELS[mode]}
                                        </h2>
                                        <p className="mt-1 max-w-2xl text-sm leading-6 text-[#766A5D]">
                                            {MODE_DESCRIPTIONS[mode]}
                                        </p>
                                    </div>
                                </legend>

                                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {games.map(([gameKey, config]) => (
                                        <div key={gameKey} className="rounded-[24px] border border-[#E8D8BF] bg-[#FBF2E4] p-2 transition-all hover:border-[#C58B2B]">
                                            <GameCard
                                                gameKey={gameKey}
                                                mode={config.mode}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </fieldset>
                        );
                    })}
                </div>

                <div className="mt-10 rounded-[30px] border border-[#E3D3BB] bg-[#1F5B45] px-6 py-8 text-[#FFF8E8] shadow-[0_18px_48px_rgba(31,91,69,0.18)] md:px-8">
                    <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
                        <div>
                            <h2 className="font-display text-3xl font-semibold tracking-tight">Une table plutôt qu’un catalogue.</h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#E7D9C4]">
                                Pour jouer à plusieurs, passe par les lobbies. La page catalogue sert à choisir le bon jeu, pas à chercher une salle.
                            </p>
                        </div>
                        <Link
                            href="/lobby/all"
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FFF8E8] px-5 py-3 text-sm font-black text-[#1F5B45] transition-all hover:bg-[#F0D7A5]"
                        >
                            Voir les lobbies
                            <ArrowRightIcon className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
