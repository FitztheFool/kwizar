'use client';

import { useEffect, useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { CpuChipIcon } from '@heroicons/react/24/outline';
import GameIcon from './GameIcon';
import UserAvatar from './UserAvatar';

interface Player {
    userId: string;
    username: string;
    image?: string | null;
}

interface GameWaitingScreenProps {
    gameType: string;
    gameName: string;
    lobbyId: string;
    players: Player[];
    myUserId: string;
    hostId?: string;
}

const isBot = (id: string) => id.startsWith('bot-');

export default function GameWaitingScreen({ gameType, gameName, lobbyId, players, myUserId, hostId }: GameWaitingScreenProps) {
    const [cachedPlayers] = useState<Player[]>(() => {
        try {
            const cached = sessionStorage.getItem(`lobby_players_${lobbyId}`);
            return cached ? JSON.parse(cached) : [];
        } catch { return []; }
    });

    useEffect(() => {
        if (players.length > 0) {
            sessionStorage.removeItem(`lobby_players_${lobbyId}`);
        }
    }, [players.length, lobbyId]);

    const displayPlayers = players.length > 0 ? players : cachedPlayers;
    const humanCount = displayPlayers.filter(p => !isBot(p.userId)).length;
    const botCount = displayPlayers.length - humanCount;

    return (
        <div
            className="min-h-dvh flex flex-col text-gray-900 dark:text-white overflow-hidden relative"
            style={{
                background: `
                    radial-gradient(circle at 50% 16%, rgba(220,38,38,0.12), transparent 52%),
                    radial-gradient(circle at 50% 94%, rgba(245,158,11,0.08), transparent 55%)
                `,
            }}
        >
            <style>{`
                @keyframes gws-fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes gws-ring { 0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.5), 0 8px 36px rgba(220,38,38,0.28); } 50% { box-shadow: 0 0 0 16px rgba(220,38,38,0), 0 8px 36px rgba(220,38,38,0.5); } }
                @keyframes gws-pulse-dot { 0%, 80%, 100% { opacity: 0.25; transform: scale(0.7); } 40% { opacity: 1; transform: scale(1); } }
                @keyframes gws-live { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
                @keyframes gws-orbit { to { transform: rotate(360deg); } }
                @keyframes gws-shimmer { 0% { transform: translateX(-120%); } 100% { transform: translateX(320%); } }
                @keyframes gws-grid-pan { to { background-position: 44px 44px; } }
            `}</style>

            {/* faint moving grid for depth */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.5] dark:opacity-100"
                style={{
                    backgroundImage: `linear-gradient(rgba(220,38,38,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.05) 1px, transparent 1px)`,
                    backgroundSize: '44px 44px',
                    maskImage: 'radial-gradient(circle at 50% 40%, black, transparent 75%)',
                    WebkitMaskImage: 'radial-gradient(circle at 50% 40%, black, transparent 75%)',
                    animation: 'gws-grid-pan 9s linear infinite',
                }}
            />

            {/* Header */}
            <header className="shrink-0 h-14 border-b border-gray-200/60 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-sm px-6 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500" style={{ animation: 'gws-live 1.6s ease-in-out infinite' }} />
                    <span className="text-[10px] font-black tracking-[0.3em] text-gray-500 dark:text-gray-400 uppercase">Kwizar</span>
                </div>
                <span className="text-xs text-gray-400 dark:text-white/40 tracking-widest uppercase font-bold">En attente</span>
            </header>

            {/* Main */}
            <main className="flex-1 flex items-center justify-center p-4 relative z-10">
                <div className="w-full max-w-sm flex flex-col items-center gap-7" style={{ animation: 'gws-fade-up 360ms ease-out' }}>

                    {/* Game icon — pulsing core + rotating conic ring (server powering up) */}
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <div
                            aria-hidden
                            className="absolute inset-0 rounded-full"
                            style={{
                                background: 'conic-gradient(from 0deg, transparent 0deg, rgba(220,38,38,0.55) 70deg, rgba(245,158,11,0.55) 130deg, transparent 200deg)',
                                animation: 'gws-orbit 3.2s linear infinite',
                                maskImage: 'radial-gradient(circle, transparent 60%, black 61%, black 72%, transparent 73%)',
                                WebkitMaskImage: 'radial-gradient(circle, transparent 60%, black 61%, black 72%, transparent 73%)',
                            }}
                        />
                        <div
                            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center"
                            style={{ animation: 'gws-ring 2s ease-in-out infinite' }}
                        >
                            <GameIcon gameType={gameType} className="w-12 h-12 text-white" />
                        </div>
                    </div>

                    {/* Title + game name + waiting dots */}
                    <div className="text-center">
                        <p className="text-xs font-bold tracking-[0.25em] uppercase text-gray-500 dark:text-gray-400 mb-1">{gameName}</p>
                        <h1 className="text-3xl font-black tracking-tight inline-flex items-baseline gap-1">
                            Démarrage
                            <span className="inline-flex items-end gap-0.5 ml-0.5 pb-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary-500" style={{ animation: 'gws-pulse-dot 1.2s ease-in-out infinite' }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-warning" style={{ animation: 'gws-pulse-dot 1.2s ease-in-out 0.2s infinite' }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-primary-500" style={{ animation: 'gws-pulse-dot 1.2s ease-in-out 0.4s infinite' }} />
                            </span>
                        </h1>

                        {/* indeterminate progress shimmer — signals active startup */}
                        <div className="relative w-40 h-1 mx-auto mt-3 rounded-full bg-gray-200/70 dark:bg-white/[0.08] overflow-hidden">
                            <div
                                className="absolute inset-y-0 w-1/3 rounded-full"
                                style={{
                                    background: 'linear-gradient(90deg, transparent, #dc2626, #f59e0b, transparent)',
                                    animation: 'gws-shimmer 1.5s ease-in-out infinite',
                                }}
                            />
                        </div>

                        <p className="text-gray-500 dark:text-white/50 text-sm mt-3">
                            {humanCount} joueur{humanCount > 1 ? 's' : ''}
                            {botCount > 0 && <span className="text-gray-400 dark:text-white/40"> · {botCount} bot{botCount > 1 ? 's' : ''}</span>}
                        </p>
                    </div>

                    {/* Players list */}
                    {displayPlayers.length > 0 && (
                        <div className="w-full bg-white/80 dark:bg-white/[0.04] border border-gray-200/70 dark:border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur-sm">
                            {displayPlayers.map((p, i) => {
                                const bot = isBot(p.userId);
                                return (
                                    <div
                                        key={p.userId}
                                        className={`flex items-center gap-3 px-4 py-3 ${i < displayPlayers.length - 1 ? 'border-b border-gray-100 dark:border-white/[0.04]' : ''}`}
                                        style={{ animation: `gws-fade-up 320ms ease-out ${i * 60}ms backwards` }}
                                    >
                                        {bot ? (
                                            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-[0_4px_14px_rgba(99,102,241,0.4)]">
                                                <CpuChipIcon className="w-5 h-5 text-white" />
                                            </div>
                                        ) : (
                                            <UserAvatar seed={p.userId} name={p.username} image={p.image} size="md" shape="square" online />
                                        )}
                                        <span className="flex-1 text-sm font-semibold truncate">{bot ? p.username.replace(/^🤖\s*/, '') : p.username}</span>
                                        <div className="flex items-center gap-1.5">
                                            {bot && (
                                                <span className="text-[10px] font-bold tracking-wider uppercase bg-indigo-100 dark:bg-indigo-400/15 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full">bot</span>
                                            )}
                                            {hostId && p.userId === hostId && (
                                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold tracking-wider uppercase bg-yellow-100 dark:bg-yellow-400/15 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                                                    <StarIcon className="w-3 h-3" /> host
                                                </span>
                                            )}
                                            {p.userId === myUserId && (
                                                <span className="text-[10px] font-bold tracking-wider uppercase bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/60 px-2 py-0.5 rounded-full">moi</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* server status line */}
                    <div className="flex items-center gap-2 -mt-2 text-[11px] font-medium text-gray-400 dark:text-white/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-warning" style={{ animation: 'gws-live 1.4s ease-in-out infinite' }} />
                        Connexion au serveur de jeu…
                    </div>
                </div>
            </main>
        </div>
    );
}
