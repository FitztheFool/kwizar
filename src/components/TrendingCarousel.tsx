'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/swr';
import { GAME_CONFIG, gameCoverUrl } from '@/lib/gameConfig';
import { GAME_THEME, gameThemeVars, type GameKey } from '@/lib/theme/games';
import { FireIcon } from '@heroicons/react/24/solid';

export default function TrendingCarousel() {
    const router = useRouter();
    const { data } = useSWR<{ games: string[] }>('/api/games/trending', fetcher);
    const { data: coversData } = useSWR<{ covers: Record<string, string> }>('/api/games/covers', fetcher);
    const { data: labelsData } = useSWR<{ labels: Record<string, string> }>('/api/games/labels', fetcher);

    const games = (data?.games ?? []).filter(k => k in GAME_CONFIG);
    const n = games.length;

    const [idx, setIdx] = useState(0);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (n <= 1 || paused) return;
        const t = window.setInterval(() => setIdx(i => (i + 1) % n), 3200);
        return () => window.clearInterval(t);
    }, [n, paused]);

    if (n === 0) return null;

    const sides = Math.min(2, Math.floor((n - 1) / 2));
    const offsets = Array.from({ length: sides * 2 + 1 }, (_, i) => i - sides);

    const tile = (key: string, label: string) => {
        const g = GAME_CONFIG[key as keyof typeof GAME_CONFIG];
        const cover = coversData?.covers?.[key] ?? gameCoverUrl(key);
        return { g, cover, label };
    };

    return (
        <section className="mb-10">
            <div className="mb-5 flex items-center gap-2">
                <FireIcon className="h-5 w-5 text-primary-500" />
                <h2 className="section-title text-lg text-gray-900 dark:text-white">En tendances</h2>
            </div>

            <div
                className="relative h-52 sm:h-60 select-none"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                // overflow-x: clip → coupe les cartes latérales au bord de la colonne (pas de débordement
                // ni de scroll horizontal) ; overflow-y: visible → laisse respirer la carte centrale (plus
                // haute que le conteneur) et son halo. clip-path ne suffisait pas : il masque le rendu mais
                // ne retire pas les cartes (position:absolute) de la zone de débordement de la page.
                style={{ perspective: '1200px', overflowX: 'clip', overflowY: 'visible' }}
            >
                {offsets.map(o => {
                    const key = games[(idx + o + n) % n];
                    const label = labelsData?.labels?.[key] ?? GAME_CONFIG[key as keyof typeof GAME_CONFIG].label;
                    const { g, cover } = tile(key, label);
                    const abs = Math.abs(o);
                    const isCenter = o === 0;
                    const scale = isCenter ? 1 : abs === 1 ? 0.84 : 0.66;
                    const opacity = isCenter ? 1 : abs === 1 ? 0.55 : 0.25;
                    const translate = o * 58; // en %
                    const z = 20 - abs;
                    const onClick = () => {
                        if (isCenter) router.push(`/leaderboard/${key}`);
                        else setIdx((idx + o + n) % n);
                    };
                    return (
                        <button
                            key={`${o}-${key}`}
                            onClick={onClick}
                            aria-label={label}
                            className="group absolute left-1/2 top-1/2 w-[68%] sm:w-[460px] aspect-[16/9] -ml-[34%] sm:-ml-[230px] -mt-[19%] sm:-mt-[129px] rounded-2xl overflow-hidden ring-1 ring-black/10 dark:ring-white/10 transition-all duration-500 ease-out"
                            style={{
                                ...gameThemeVars(key as GameKey),
                                transform: `translateX(${translate}%) scale(${scale})`,
                                opacity,
                                zIndex: z,
                                // La diapo centrale rayonne de la couleur de SON jeu, pas de
                                // l'accent de marque : c'est ce jeu qu'on met en avant.
                                boxShadow: isCenter
                                    ? `0 18px 55px -12px ${GAME_THEME[key as GameKey].hex}99`
                                    : '0 8px 24px -12px rgba(0,0,0,0.5)',
                            }}
                            tabIndex={isCenter ? 0 : -1}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={cover} alt={label} draggable={false}
                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

                            {isCenter && (
                                <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-primary-600/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
                                    <FireIcon className="h-3 w-3" /> Tendance
                                </span>
                            )}

                            <div className="absolute inset-x-0 bottom-0 p-4 text-left">
                                <div className="text-lg sm:text-xl font-black text-white leading-tight truncate drop-shadow">{label}</div>
                                {isCenter && (
                                    <div className="mt-0.5 flex items-center gap-3 text-[11px] text-gray-200">
                                        <span>{g.players}</span>
                                        <span className="opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all font-bold text-game">Jouer →</span>
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Indicateurs */}
            {n > 1 && (
                <div className="mt-3 flex justify-center gap-1.5">
                    {games.map((k, i) => (
                        <button
                            key={k}
                            onClick={() => setIdx(i)}
                            aria-label={`Aller au jeu ${i + 1}`}
                            className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-6 bg-primary-500' : 'w-1.5 bg-gray-300 dark:bg-white/20 hover:bg-gray-400'}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
