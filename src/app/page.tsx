'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    ArrowRightIcon,
    FireIcon,
    PlayIcon,
    PlusIcon,
    RectangleGroupIcon,
    SparklesIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';

import { GAME_CONFIG, GAME_LABEL_MAP, type GameMode } from '@/lib/gameConfig';
import GameIcon from '@/components/GameIcon';
import { useLobbySocket } from '@/hooks/useSocket';

type Stats = {
    parties: number;
    points: number;
};

type Lobby = {
    id: string;
    title: string;
    description: string;
    gameType: string;
    maxPlayers: number;
    currentPlayers: number;
    status: 'waiting' | 'in-progress';
    host: string;
    playerNames?: string[];
};

type FeaturedPayload = {
    popularGames?: string[];
};

const FALLBACK_POPULAR_GAMES = ['uno', 'skyjow', 'quiz', 'puissance4'];

function fmt(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.0', '')}k`;
    return n.toString();
}

function getGameKeyFromLobby(gameType: string): keyof typeof GAME_CONFIG | null {
    const normalized = gameType.toUpperCase();

    const entry = Object.entries(GAME_CONFIG).find(([key, config]) => {
        return key === gameType || config.gameType.toUpperCase() === normalized;
    });

    return (entry?.[0] as keyof typeof GAME_CONFIG | undefined) ?? null;
}

function getLobbyMode(gameType: string): GameMode | null {
    const gameKey = getGameKeyFromLobby(gameType);
    return gameKey ? GAME_CONFIG[gameKey].mode : null;
}

function getLobbyGameLabel(gameType: string): string {
    const gameKey = getGameKeyFromLobby(gameType);
    if (gameKey) return GAME_CONFIG[gameKey].label;
    return GAME_LABEL_MAP[gameType.toUpperCase()] ?? GAME_LABEL_MAP[gameType] ?? gameType;
}


function HomeGameTile({ gameKey }: { gameKey: string }) {
    const config = GAME_CONFIG[gameKey as keyof typeof GAME_CONFIG];
    const [tileLobbyCode] = useState(() => crypto.randomUUID());

    if (!config) return null;

    const modeLabel = config.mode === 'multi' ? 'Multi only' : config.mode === 'solo' ? 'Solo' : 'Solo / multi';

    return (
        <article className="group flex h-[188px] min-w-0 flex-col overflow-hidden rounded-[22px] border border-[#E8D8BF] bg-[#FFFCF5] p-4 shadow-[0_10px_24px_rgba(43,31,20,0.055)] transition-all hover:-translate-y-0.5 hover:border-[#C58B2B] hover:shadow-[0_16px_34px_rgba(43,31,20,0.085)]">
            <div className="flex min-w-0 items-start gap-3">
                <Link
                    href={`/leaderboard/${gameKey}`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-[#E3D3BB] bg-[#FBF2E4] text-[#251C15] transition-all group-hover:border-[#C58B2B]"
                    aria-label={`Voir ${config.label}`}
                >
                    <GameIcon gameType={config.gameType} className="h-5 w-5" />
                </Link>

                <div className="min-w-0 flex-1">
                    <Link href={`/leaderboard/${gameKey}`} className="block min-w-0">
                        <h3 className="truncate text-base font-black leading-5 tracking-tight text-[#251C15]" title={config.label}>
                            {config.label}
                        </h3>
                    </Link>
                    <div className="mt-1 flex min-w-0 items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#9A7440]">
                        <span className="truncate" title={modeLabel}>{modeLabel}</span>
                    </div>
                </div>
            </div>

            <p className="mt-3 line-clamp-2 min-h-[40px] break-normal text-sm leading-5 text-[#766A5D]" title={config.description}>
                {config.description}
            </p>

            <div className="mt-auto border-t border-[#EFE1CC] pt-3">
                <div className="flex min-w-0 items-center justify-between gap-2">
                    <div className="min-w-0 text-[11px] leading-4 text-[#8B7C6A]">
                        <span className="block truncate" title={config.players}>{config.players}</span>
                    </div>

                    {config.mode === 'solo' ? (
                        <Link
                            href={`/game/${gameKey}`}
                            className="shrink-0 rounded-full bg-[#1F5B45] px-3.5 py-1.5 text-xs font-black text-[#FFF8E8] transition-all hover:bg-[#174735]"
                        >
                            Jouer
                        </Link>
                    ) : (
                        <div className="flex shrink-0 items-center gap-1.5">
                            <Link
                                href={`/lobby/all?game=${gameKey}`}
                                className="rounded-full bg-[#F3E6D4] px-3 py-1.5 text-xs font-black text-[#5D5146] transition-all hover:bg-[#EAD8BE]"
                            >
                                Rejoindre
                            </Link>
                            <Link
                                href={`/lobby/create/${tileLobbyCode}?game=${gameKey}`}
                                className="rounded-full bg-[#C66A00] px-3 py-1.5 text-xs font-black text-[#FFF8E8] transition-all hover:bg-[#A95500]"
                            >
                                Créer
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}

function LobbyPreviewCard({ lobby }: { lobby: Lobby }) {
    const isFull = lobby.currentPlayers >= lobby.maxPlayers;
    const isWaiting = lobby.status === 'waiting';
    const gameLabel = getLobbyGameLabel(lobby.gameType);
    const players = lobby.playerNames ?? [];
    const occupancy = Math.min(100, Math.round((lobby.currentPlayers / Math.max(lobby.maxPlayers, 1)) * 100));

    return (
        <article className="group relative overflow-hidden rounded-[24px] border border-[#E3D3BB] bg-[#FFFCF5] shadow-[0_14px_34px_rgba(43,31,20,0.07)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#C58B2B]/70 hover:shadow-[0_20px_48px_rgba(43,31,20,0.11)]">
            <div className="absolute inset-y-0 left-0 w-2 bg-[#1F5B45]" />
            <div className="absolute -right-14 -top-14 h-32 w-32 rounded-full border border-[#E8D8BF] bg-[#F5E8D2]/55" />

            <div className="relative p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#D8C6AC] bg-[#F8EEDB] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#6B4308]">
                            <GameIcon gameType={lobby.gameType} className="h-4 w-4" />
                            {gameLabel}
                        </div>

                        <h3 className="line-clamp-1 text-lg font-black tracking-tight text-[#251C15]">
                            {lobby.title || `Table ${gameLabel}`}
                        </h3>
                    </div>

                    <span className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-black ${
                        isFull
                            ? 'border-[#D7B8AE] bg-[#F3DFD8] text-[#9E3A2F]'
                            : isWaiting
                                ? 'border-[#BFD4B8] bg-[#E9F3E4] text-[#1F5B45]'
                                : 'border-[#D7C1E9] bg-[#EFE6F7] text-[#5B3478]'
                    }`}>
                        {isFull ? 'Complet' : isWaiting ? 'Ouvert' : 'En partie'}
                    </span>
                </div>

                <p className="line-clamp-2 min-h-[40px] text-sm leading-5 text-[#766A5D]">
                    {lobby.description || 'Une table est ouverte. Rejoins les joueurs ou regarde ce qui est déjà lancé.'}
                </p>

                <div className="mt-4 rounded-[18px] border border-[#E8D8BF] bg-[#FBF2E4] p-3">
                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.16em] text-[#8B7C6A]">
                        <span>Places</span>
                        <span className="text-[#251C15]">{lobby.currentPlayers}/{lobby.maxPlayers}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E3D3BB]">
                        <div
                            className={`h-full rounded-full ${isFull ? 'bg-[#9E3A2F]' : 'bg-[#1F5B45]'}`}
                            style={{ width: `${occupancy}%` }}
                        />
                    </div>

                    <div className="mt-3 flex min-h-[26px] flex-wrap gap-2">
                        {players.slice(0, 3).map((name) => (
                            <span key={name} className="rounded-full border border-[#E3D3BB] bg-[#FFFCF5] px-2.5 py-1 text-xs font-bold text-[#5D5146]">
                                {name}
                            </span>
                        ))}
                        {players.length > 3 && (
                            <span className="rounded-full border border-[#E3D3BB] bg-[#FFFCF5] px-2.5 py-1 text-xs font-bold text-[#5D5146]">
                                +{players.length - 3}
                            </span>
                        )}
                    </div>
                </div>

                <Link
                    href={`/lobby/create/${lobby.id}`}
                    className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-black transition-all ${
                        !isFull && isWaiting
                            ? 'bg-[#1F5B45] text-[#FFF8E8] shadow-[0_10px_22px_rgba(31,91,69,0.22)] hover:bg-[#174735]'
                            : 'border border-[#D8C6AC] bg-[#FFFCF5] text-[#251C15] hover:border-[#C58B2B]'
                    }`}
                >
                    {!isFull && isWaiting ? 'Rejoindre la table' : 'Voir la table'}
                    <ArrowRightIcon className="h-4 w-4" />
                </Link>
            </div>
        </article>
    );
}

export default function HomePage() {
    const [lobbyCode, setLobbyCode] = useState('');
    const [stats, setStats] = useState<Stats | null>(null);
    const [popularGames, setPopularGames] = useState<string[]>(FALLBACK_POPULAR_GAMES);
    const [lobbies, setLobbies] = useState<Lobby[]>([]);

    const { socket, connected } = useLobbySocket();

    const totalGames = Object.keys(GAME_CONFIG).length;

    useEffect(() => {
        setLobbyCode(crypto.randomUUID());
    }, []);

    useEffect(() => {
        fetch('/api/stats')
            .then((r) => r.json())
            .then(setStats)
            .catch(() => {});
    }, []);

    useEffect(() => {
        fetch('/api/home/featured')
            .then((r) => {
                if (!r.ok) throw new Error('featured endpoint unavailable');
                return r.json();
            })
            .then((data: FeaturedPayload) => {
                const validGames = (data.popularGames ?? [])
                    .filter((key) => key in GAME_CONFIG)
                    .slice(0, 4);

                if (validGames.length > 0) setPopularGames(validGames);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!socket || !connected) return;

        socket.emit('get:lobbies');

        const onLobbies = (data: Lobby[]) => {
            setLobbies(Array.isArray(data) ? data : []);
        };

        socket.on('lobbies', onLobbies);

        return () => {
            socket.off('lobbies', onLobbies);
        };
    }, [socket, connected]);

    const multiplayerLobbies = useMemo(() => {
        return lobbies.filter((lobby) => getLobbyMode(lobby.gameType) !== 'solo');
    }, [lobbies]);

    const highlightedLobbies = useMemo(() => {
        return [...multiplayerLobbies]
            .sort((a, b) => {
                const aRatio = a.currentPlayers / Math.max(a.maxPlayers, 1);
                const bRatio = b.currentPlayers / Math.max(b.maxPlayers, 1);

                if (a.status !== b.status) {
                    return a.status === 'waiting' ? -1 : 1;
                }

                return bRatio - aRatio;
            })
            .slice(0, 4);
    }, [multiplayerLobbies]);

    const liveLobbyCount = multiplayerLobbies.length;
    const openTables = multiplayerLobbies.filter((lobby) => lobby.status === 'waiting' && lobby.currentPlayers < lobby.maxPlayers).length;

    const scrollToLobbies = () => {
        document.getElementById('lobbies')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <main className="min-h-screen bg-[#F7F1E7] text-[#251C15]">
            <section className="relative overflow-hidden border-b border-[#D8C6AC] bg-[#F7F1E7]">
                <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_18%_18%,rgba(197,139,43,0.16),transparent_24%),radial-gradient(circle_at_84%_22%,rgba(31,91,69,0.12),transparent_22%),linear-gradient(90deg,rgba(226,211,190,0.42)_1px,transparent_1px),linear-gradient(rgba(226,211,190,0.42)_1px,transparent_1px)] [background-size:auto,auto,44px_44px,44px_44px]" />

                <div className="relative mx-auto max-w-7xl px-5 py-7 md:px-8 md:py-8 lg:py-9">
                    <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D8C6AC] bg-[#FFFCF5]/85 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#6B4308] shadow-sm">
                                <SparklesIcon className="h-4 w-4" />
                                Ludothèque en ligne
                            </div>

                            <h1 className="max-w-4xl font-display text-4xl font-semibold leading-[1.02] tracking-tight text-[#251C15] md:text-5xl lg:text-6xl">
                                Kwizar, une aire de jeu pour tout le monde.
                            </h1>

                            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#766A5D] md:text-base">
                                Jeux solo pour patienter, tables multijoueurs pour se retrouver, et activité visible dès l’accueil.
                            </p>

                            <div className="mt-5 flex flex-wrap gap-3">
                                <Link
                                    href="/lobby/all"
                                    className="inline-flex items-center gap-2 rounded-full bg-[#1F5B45] px-5 py-2.5 text-sm font-black text-[#FFF8E8] shadow-[0_10px_24px_rgba(31,91,69,0.22)] transition-all hover:bg-[#174735]"
                                >
                                    <PlayIcon className="h-4 w-4" />
                                    Voir les tables
                                </Link>

                                <Link
                                    href={lobbyCode ? `/lobby/create/${lobbyCode}` : '/lobby/all'}
                                    className="inline-flex items-center gap-2 rounded-full border border-[#D8C6AC] bg-[#FFFCF5] px-5 py-2.5 text-sm font-black text-[#251C15] shadow-sm transition-all hover:border-[#C58B2B] hover:bg-[#F8EEDB]"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Créer une table
                                </Link>

                                <Link
                                    href="/games"
                                    className="inline-flex items-center gap-2 rounded-full border border-transparent px-4 py-2.5 text-sm font-black text-[#1F5B45] transition-all hover:bg-[#EADCC7]"
                                >
                                    Tous les jeux
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>

                        <div className="relative rounded-[28px] border border-[#E3D3BB] bg-[#FFFCF5]/86 p-4 shadow-[0_16px_46px_rgba(43,31,20,0.08)] backdrop-blur-sm">
                            <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full border border-[#E8D8BF] bg-[#F8ECCD]/70" />

                            <div className="relative grid grid-cols-4 gap-2 lg:grid-cols-2">
                                {[
                                    { value: fmt(totalGames), label: 'jeux' },
                                    { value: stats ? fmt(stats.parties) : '—', label: 'parties' },
                                    { value: stats ? fmt(stats.points) : '—', label: 'points' },
                                    { value: fmt(liveLobbyCount), label: 'tables' },
                                ].map(({ value, label }) => (
                                    <div
                                        key={label}
                                        className="rounded-[20px] border border-[#E8D8BF] bg-[#FBF2E4] px-3 py-3 text-center"
                                    >
                                        <span className="block font-display text-2xl font-bold leading-none text-[#1F5B45] md:text-3xl">{value}</span>
                                        <span className="mt-1 block text-[9px] font-black uppercase tracking-[0.16em] text-[#8B7C6A]">
                                            {label}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="relative mt-3 rounded-[20px] border border-[#D8C6AC] bg-[#1F5B45] p-3 text-[#FFF8E8]">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F0D7A5]">Table vivante</div>
                                <p className="mt-1 text-xs leading-5 text-[#E7D9C4]">
                                    {openTables > 0
                                        ? `${openTables} table${openTables > 1 ? 's' : ''} avec des places disponibles.`
                                        : 'Aucune table ouverte. Le premier joueur lance l’ambiance.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-5 py-6 md:px-8 md:py-7">
                <div className="grid gap-7 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_300px]">
                    <div className="space-y-7">
                        <section>
                            <div className="mb-4 flex items-end justify-between gap-4">
                                <div>
                                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#D8C6AC] bg-[#FFFCF5] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#6B4308]">
                                        <FireIcon className="h-4 w-4" />
                                        Sélection
                                    </div>
                                    <h2 className="font-display text-2xl font-semibold tracking-tight text-[#251C15] md:text-3xl">
                                        Les jeux les plus joués
                                    </h2>
                                    <p className="mt-1 max-w-2xl text-sm leading-6 text-[#766A5D]">
                                        Quatre portes d’entrée. Le catalogue complet reste à part.
                                    </p>
                                </div>

                                <Link
                                    href="/games"
                                    className="hidden items-center gap-2 rounded-full border border-[#D8C6AC] bg-[#FFFCF5] px-4 py-2 text-sm font-black text-[#1F5B45] transition-all hover:border-[#C58B2B] sm:inline-flex"
                                >
                                    Tous les jeux
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                {popularGames.map((key) => (
                                    <HomeGameTile key={key} gameKey={key} />
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={scrollToLobbies}
                                className="mx-auto mt-5 flex w-fit flex-col items-center rounded-[22px] border border-[#D8C6AC] bg-[#FFFCF5] px-6 py-3 text-center text-[#1F5B45] shadow-[0_10px_28px_rgba(43,31,20,0.06)] transition-all hover:-translate-y-0.5 hover:border-[#C58B2B] hover:bg-[#F8EEDB]"
                                aria-label="Descendre vers les lobbies"
                            >
                                <span className="font-mono text-[11px] leading-3 text-[#9A7440]">╭── 🎲 ──╮</span>
                                <span className="mt-1 text-sm font-black uppercase tracking-[0.18em]">Les lobbies</span>
                                <span className="font-mono text-[11px] leading-3 text-[#9A7440]">╰── ↓ ──╯</span>
                            </button>
                        </section>

                        <section id="lobbies" className="scroll-mt-24">
                            <div className="mb-4 flex items-end justify-between gap-4">
                                <div>
                                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#D8C6AC] bg-[#FFFCF5] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#6B4308]">
                                        <UsersIcon className="h-4 w-4" />
                                        En direct
                                    </div>
                                    <h2 className="font-display text-2xl font-semibold tracking-tight text-[#251C15] md:text-3xl">
                                        Tables en cours
                                    </h2>
                                    <p className="mt-1 max-w-2xl text-sm leading-6 text-[#766A5D]">
                                        Tables ouvertes, complètes ou déjà lancées : l’activité doit être visible.
                                    </p>
                                </div>

                                <Link
                                    href="/lobby/all?showFull=1&showInProgress=1"
                                    className="hidden items-center gap-2 rounded-full border border-[#D8C6AC] bg-[#FFFCF5] px-4 py-2 text-sm font-black text-[#1F5B45] transition-all hover:border-[#C58B2B] sm:inline-flex"
                                >
                                    Toutes les tables
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Link>
                            </div>

                            {highlightedLobbies.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {highlightedLobbies.map((lobby) => (
                                        <LobbyPreviewCard key={lobby.id} lobby={lobby} />
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-[26px] border border-dashed border-[#CBB89E] bg-[#FFFCF5] p-6 text-center shadow-[0_14px_34px_rgba(43,31,20,0.05)]">
                                    <h3 className="font-display text-xl font-semibold tracking-tight text-[#251C15]">
                                        Aucune table visible pour le moment.
                                    </h3>
                                    <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#766A5D]">
                                        L’entrée rapide vers la création de table reste visible pour amorcer l’activité.
                                    </p>
                                    <Link
                                        href={lobbyCode ? `/lobby/create/${lobbyCode}` : '/lobby/all'}
                                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1F5B45] px-5 py-2.5 text-sm font-black text-[#FFF8E8] transition-all hover:bg-[#174735]"
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                        Créer la première table
                                    </Link>
                                </div>
                            )}
                        </section>
                    </div>

                    <aside className="space-y-4 lg:sticky lg:top-5 lg:self-start">
                        <div className="rounded-[26px] border border-[#E3D3BB] bg-[#FFFCF5] p-5 shadow-[0_14px_34px_rgba(43,31,20,0.06)]">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#F8EEDB] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#6B4308]">
                                <RectangleGroupIcon className="h-3.5 w-3.5" />
                                Catalogue
                            </div>
                            <h2 className="font-display text-xl font-semibold tracking-tight text-[#251C15]">
                                Tous les jeux restent rangés.
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-[#766A5D]">
                                Solo, solo-multi et multi only sont séparés dans une vraie page ludothèque.
                            </p>
                            <Link
                                href="/games"
                                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#D8C6AC] bg-[#FBF2E4] px-5 py-2.5 text-sm font-black text-[#251C15] transition-all hover:border-[#C58B2B]"
                            >
                                Voir le catalogue
                                <ArrowRightIcon className="h-4 w-4" />
                            </Link>
                        </div>

                        <div className="rounded-[26px] border border-[#E3D3BB] bg-[#1F5B45] p-5 text-[#FFF8E8] shadow-[0_16px_42px_rgba(31,91,69,0.18)]">
                            <div className="text-xs font-black uppercase tracking-[0.2em] text-[#F0D7A5]">Créer une table</div>
                            <p className="mt-3 text-sm leading-6 text-[#E7D9C4]">
                                Une partie multijoueur doit ressembler à une table ouverte, pas à un formulaire technique.
                            </p>
                            <Link
                                href={lobbyCode ? `/lobby/create/${lobbyCode}` : '/lobby/all'}
                                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#FFF8E8] px-5 py-2.5 text-sm font-black text-[#1F5B45] transition-all hover:bg-[#F0D7A5]"
                            >
                                Lancer une table
                                <PlusIcon className="h-4 w-4" />
                            </Link>
                        </div>
                    </aside>
                </div>
            </section>
        </main>
    );
}
