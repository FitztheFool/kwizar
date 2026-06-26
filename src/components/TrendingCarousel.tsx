'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/lib/swr';
import { GAME_CONFIG, gameCoverUrl } from '@/lib/gameConfig';
import { FireIcon } from '@heroicons/react/24/solid';

export default function TrendingCarousel() {
    const { data } = useSWR<{ games: string[] }>('/api/games/trending', fetcher);
    const { data: coversData } = useSWR<{ covers: Record<string, string> }>('/api/games/covers', fetcher);
    const { data: labelsData } = useSWR<{ labels: Record<string, string> }>('/api/games/labels', fetcher);

    const games = (data?.games ?? []).filter(k => k in GAME_CONFIG);
    if (games.length === 0) return null;

    return (
        <section className="mb-8">
            <div className="mb-3 flex items-center gap-2">
                <FireIcon className="h-5 w-5 text-clay-500" />
                <h2 className="text-lg font-black tracking-tight text-gray-900 dark:text-white">En tendances</h2>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x [scrollbar-width:thin]">
                {games.map(key => {
                    const g = GAME_CONFIG[key as keyof typeof GAME_CONFIG];
                    const cover = coversData?.covers?.[key] ?? gameCoverUrl(key);
                    const label = labelsData?.labels?.[key] ?? g.label;
                    return (
                        <Link
                            key={key}
                            href={`/leaderboard/${key}`}
                            className="group relative shrink-0 snap-start w-52 sm:w-60 aspect-[16/9] overflow-hidden rounded-2xl glass ring-1 ring-black/5 dark:ring-white/10 transition-all hover:-translate-y-0.5"
                            title={label}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={cover} alt={label} draggable={false}
                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-clay-500/90 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
                                <FireIcon className="h-3 w-3" /> Tendance
                            </span>
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pt-8 pb-2.5">
                                <div className="text-sm font-bold text-white leading-tight truncate">{label}</div>
                                <div className="text-[11px] text-gray-300 truncate">{g.players}</div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
