// src/app/lobby/all/page.tsx
'use client';

import ServerWarmupLoader from '@/components/ServerWarmupLoader';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLobbySocket } from '@/hooks/useSocket';
import { useServerWarmup } from '@/hooks/useServerWarmup';
import { GAME_CONFIG, GAME_LABEL_MAP, type GameMode } from '@/lib/gameConfig';
import GameIcon from '@/components/GameIcon';
import PlayerModal from '@/components/PlayerModal';
import {
    ArrowRightIcon,
    CheckIcon,
    ClockIcon,
    FlagIcon,
    FunnelIcon,
    PlayIcon,
    PlusIcon,
    RectangleGroupIcon,
    SparklesIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';

interface Lobby {
    id: string;
    title: string;
    description: string;
    gameType: string;
    maxPlayers: number;
    currentPlayers: number;
    status: 'waiting' | 'in-progress';
    host: string;
    playerNames?: string[];
}

type ModeFilter = 'all' | Exclude<GameMode, 'solo'>;
type SortFilter = 'newest' | 'players' | 'capacity';

type LobbyTableCardProps = {
    lobby: Lobby;
    onJoin: (lobbyId: string) => void;
    onPlayersClick: (lobbyId: string, playerNames: string[]) => void;
};

const modeFilters: { value: ModeFilter; label: string; description: string }[] = [
    { value: 'all', label: 'Toutes les tables', description: 'Solo-multi et multi only' },
    { value: 'both', label: 'Solo / multi', description: 'Jouable seul ou à plusieurs' },
    { value: 'multi', label: 'Multi only', description: 'Pensé pour la table' },
];

const sortFilters: { value: SortFilter; label: string }[] = [
    { value: 'newest', label: 'Plus récent' },
    { value: 'players', label: 'Plus peuplé' },
    { value: 'capacity', label: 'Plus rempli' },
];

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

function isModeFilter(value: string | null): value is ModeFilter {
    return value === 'all' || value === 'both' || value === 'multi';
}

function LobbyTableCard({ lobby, onJoin, onPlayersClick }: LobbyTableCardProps) {
    const isFull = lobby.currentPlayers >= lobby.maxPlayers;
    const isWaiting = lobby.status === 'waiting';
    const players = lobby.playerNames ?? [];
    const previewPlayers = players.slice(0, 4);
    const occupancy = Math.min(100, Math.round((lobby.currentPlayers / Math.max(lobby.maxPlayers, 1)) * 100));
    const gameLabel = getLobbyGameLabel(lobby.gameType);

    return (
        <article className="group relative overflow-hidden rounded-[28px] border border-[#E3D3BB] bg-[#FFFCF5] shadow-[0_16px_42px_rgba(43,31,20,0.07)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#C58B2B]/70 hover:shadow-[0_24px_60px_rgba(43,31,20,0.11)]">
            <div className="absolute inset-y-0 left-0 w-2 bg-[#1F5B45]" />
            <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full border border-[#E8D8BF] bg-[#F5E8D2]/50" />
            <div className="absolute -bottom-20 right-12 h-32 w-32 rounded-full border border-[#E8D8BF] bg-[#F8ECCD]/70" />

            <div className="relative p-5 md:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D8C6AC] bg-[#F8EEDB] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#6B4308]">
                            <GameIcon gameType={lobby.gameType} className="h-4 w-4" />
                            {gameLabel}
                        </div>

                        <h3 className="line-clamp-1 text-2xl font-black tracking-tight text-[#251C15]">
                            {lobby.title || `Table ${gameLabel}`}
                        </h3>

                        <p className="mt-2 line-clamp-2 min-h-[44px] text-sm leading-6 text-[#766A5D]">
                            {lobby.description || 'Une table est ouverte. Rejoins la partie dès que les joueurs sont prêts.'}
                        </p>
                    </div>

                    <span className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${
                        isWaiting
                            ? 'border-[#BFD4B8] bg-[#E9F3E4] text-[#1F5B45]'
                            : 'border-[#D7C1E9] bg-[#EFE6F7] text-[#5B3478]'
                    }`}>
                        <span className={`h-2 w-2 rounded-full ${isWaiting ? 'bg-[#1F8A5B]' : 'bg-[#7C3AED]'}`} />
                        {isWaiting ? 'En attente' : 'En partie'}
                    </span>
                </div>

                <div className="mt-6 rounded-2xl border border-[#E7D9C4] bg-[#FBF2E4] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3 text-sm">
                        <button
                            type="button"
                            onClick={() => onPlayersClick(lobby.id, players)}
                            className="inline-flex items-center gap-2 font-black text-[#251C15] hover:text-[#1F5B45]"
                        >
                            <UsersIcon className="h-4 w-4" />
                            {lobby.currentPlayers}/{lobby.maxPlayers} joueurs
                        </button>

                        <span className="text-xs font-bold text-[#8B7C6A]">
                            Hôte : <span className="text-[#251C15]">{lobby.host}</span>
                        </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-[#E3D3BB]">
                        <div
                            className="h-full rounded-full bg-[#1F5B45] transition-all duration-500"
                            style={{ width: `${occupancy}%` }}
                        />
                    </div>

                    <div className="mt-4 flex min-h-[34px] flex-wrap gap-2">
                        {previewPlayers.length > 0 ? (
                            <>
                                {previewPlayers.map((player) => (
                                    <span
                                        key={player}
                                        className="rounded-full border border-[#D8C6AC] bg-[#FFFCF5] px-3 py-1 text-xs font-bold text-[#5D5146]"
                                    >
                                        {player}
                                    </span>
                                ))}
                                {players.length > previewPlayers.length && (
                                    <span className="rounded-full border border-[#D8C6AC] bg-[#FFFCF5] px-3 py-1 text-xs font-bold text-[#5D5146]">
                                        +{players.length - previewPlayers.length}
                                    </span>
                                )}
                            </>
                        ) : (
                            <span className="rounded-full border border-dashed border-[#D8C6AC] bg-[#FFFCF5] px-3 py-1 text-xs font-bold text-[#8B7C6A]">
                                Joueurs masqués
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-5 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => onJoin(lobby.id)}
                        disabled={isFull && isWaiting}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#1F5B45] px-5 py-3 text-sm font-black text-[#FFF8E8] transition-all hover:bg-[#174735] disabled:cursor-not-allowed disabled:bg-[#B8AA98]"
                    >
                        {isFull && isWaiting ? (
                            <>
                                <CheckIcon className="h-4 w-4" />
                                Table complète
                            </>
                        ) : (
                            <>
                                <PlayIcon className="h-4 w-4" />
                                {isWaiting ? 'Rejoindre la table' : 'Voir la table'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </article>
    );
}

function LobbiesPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { status: warmupStatus } = useServerWarmup(process.env.NEXT_PUBLIC_LOBBY_SERVER_URL);
    const { socket, connected } = useLobbySocket();
    const [lobbies, setLobbies] = useState<Lobby[]>([]);

    const [selectedMode, setSelectedMode] = useState<ModeFilter>(() => {
        const mode = searchParams.get('mode');
        return isModeFilter(mode) ? mode : 'all';
    });
    const [showFull, setShowFull] = useState(() => searchParams.get('showFull') === '1');
    const [showInProgress, setShowInProgress] = useState(() => searchParams.get('showInProgress') === '1');
    const [sortBy, setSortBy] = useState<SortFilter>('newest');
    const [lobbyPlayerModal, setLobbyPlayerModal] = useState<{ gameId: string; players: { username: string; score: number; placement: number | null }[] } | null>(null);

    useEffect(() => {
        if (socket && connected) {
            socket.emit('get:lobbies');

            const onLobbies = (data: Lobby[]) => {
                setLobbies(Array.isArray(data) ? data : []);
            };

            socket.on('lobbies', onLobbies);

            return () => {
                socket.off('lobbies', onLobbies);
            };
        }
    }, [socket, connected]);

    const multiplayerLobbies = lobbies.filter((lobby) => getLobbyMode(lobby.gameType) !== 'solo');

    const filteredLobbies = multiplayerLobbies.filter(lobby => {
        const lobbyMode = getLobbyMode(lobby.gameType);

        if (selectedMode !== 'all' && lobbyMode !== selectedMode) return false;
        if (!showFull && lobby.currentPlayers >= lobby.maxPlayers) return false;
        if (!showInProgress && lobby.status === 'in-progress') return false;
        return true;
    }).sort((a, b) => {
        switch (sortBy) {
            case 'players':
                return b.currentPlayers - a.currentPlayers;
            case 'capacity':
                return (b.currentPlayers / Math.max(b.maxPlayers, 1)) - (a.currentPlayers / Math.max(a.maxPlayers, 1));
            case 'newest':
            default:
                return b.id.localeCompare(a.id);
        }
    });

    const waitingCount = multiplayerLobbies.filter((lobby) => lobby.status === 'waiting').length;
    const inProgressCount = multiplayerLobbies.filter((lobby) => lobby.status === 'in-progress').length;
    const openSeats = multiplayerLobbies.reduce((acc, lobby) => acc + Math.max(lobby.maxPlayers - lobby.currentPlayers, 0), 0);

    const joinLobby = (lobbyId: string) => {
        router.push(`/lobby/create/${lobbyId}`);
    };

    const resetFilters = () => {
        setSelectedMode('all');
        setShowFull(false);
        setShowInProgress(false);
        setSortBy('newest');
    };

    if (warmupStatus === 'warming' || warmupStatus === 'checking') return <ServerWarmupLoader />;
    if (warmupStatus === 'error') return <ServerWarmupLoader error />;

    return (
        <main className="min-h-screen bg-[#F7F1E7] text-[#251C15]">
            <section className="relative overflow-hidden border-b border-[#D8C6AC] bg-[#F7F1E7]">
                <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_18%_18%,rgba(197,139,43,0.14),transparent_23%),radial-gradient(circle_at_88%_8%,rgba(31,91,69,0.12),transparent_20%),linear-gradient(90deg,rgba(226,211,190,0.38)_1px,transparent_1px),linear-gradient(rgba(226,211,190,0.38)_1px,transparent_1px)] [background-size:auto,auto,44px_44px,44px_44px]" />

                <div className="relative mx-auto max-w-7xl px-5 py-5 md:px-8 md:py-6">
                    <div className="rounded-[28px] border border-[#E3D3BB] bg-[#FFFCF5]/84 p-4 shadow-[0_12px_34px_rgba(43,31,20,0.06)] backdrop-blur-sm md:p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0">
                                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#D8C6AC] bg-[#F8EEDB] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#6B4308]">
                                    <RectangleGroupIcon className="h-3.5 w-3.5" />
                                    Tables multijoueurs
                                </div>

                                <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-[#251C15] md:text-4xl">
                                    Tables ouvertes
                                </h1>

                                <p className="mt-1 max-w-2xl text-sm leading-6 text-[#766A5D]">
                                    Rejoins une partie, consulte les tables lancées ou crée ta propre table. Les jeux solo restent dans le catalogue.
                                </p>

                                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-black uppercase tracking-[0.15em] text-[#8B7C6A]">
                                    <span><strong className="font-display text-lg text-[#1F5B45]">{multiplayerLobbies.length}</strong> tables</span>
                                    <span><strong className="font-display text-lg text-[#1F5B45]">{waitingCount}</strong> attente</span>
                                    <span><strong className="font-display text-lg text-[#1F5B45]">{inProgressCount}</strong> en cours</span>
                                    <span><strong className="font-display text-lg text-[#1F5B45]">{openSeats}</strong> places</span>
                                </div>
                            </div>

                            <div className="flex shrink-0 flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => router.push(`/lobby/create/${crypto.randomUUID()}`)}
                                    className="inline-flex items-center gap-2 rounded-full bg-[#1F5B45] px-4 py-2.5 text-sm font-black text-[#FFF8E8] shadow-[0_10px_22px_rgba(31,91,69,0.20)] transition-all hover:bg-[#174735]"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Créer une table
                                </button>

                                <Link
                                    href="/games"
                                    className="inline-flex items-center gap-2 rounded-full border border-[#D8C6AC] bg-[#FFFCF5] px-4 py-2.5 text-sm font-black text-[#251C15] transition-all hover:border-[#C58B2B]"
                                >
                                    Tous les jeux
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-5 py-5 md:px-8 md:py-6">
                <div className="rounded-[24px] border border-[#E3D3BB] bg-[#FFFCF5] p-3 shadow-[0_10px_28px_rgba(43,31,20,0.05)] md:p-4">
                    <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#6B4308]">
                                <FunnelIcon className="h-4 w-4" />
                                Filtres
                            </div>
                            <p className="text-sm text-[#766A5D]">
                                {filteredLobbies.length}/{multiplayerLobbies.length} table{multiplayerLobbies.length > 1 ? 's' : ''} affichée{filteredLobbies.length > 1 ? 's' : ''}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D8C6AC] bg-[#F8EEDB] px-3 py-1.5 text-xs font-black text-[#5D5146] transition-all hover:border-[#C58B2B]"
                        >
                            Réinitialiser
                        </button>
                    </div>

                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex flex-wrap gap-2">
                            {modeFilters.map((mode) => (
                                <button
                                    key={mode.value}
                                    type="button"
                                    onClick={() => setSelectedMode(mode.value)}
                                    className={`rounded-full border px-4 py-2 text-sm font-black transition-all ${
                                        selectedMode === mode.value
                                            ? 'border-[#1F5B45] bg-[#1F5B45] text-[#FFF8E8] shadow-[0_8px_20px_rgba(31,91,69,0.18)]'
                                            : 'border-[#D8C6AC] bg-[#FFFCF5] text-[#5D5146] hover:border-[#C58B2B]'
                                    }`}
                                    title={mode.description}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setShowFull((value) => !value)}
                                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black transition-all ${
                                    showFull
                                        ? 'border-[#1F5B45] bg-[#1F5B45] text-[#FFF8E8]'
                                        : 'border-[#D8C6AC] bg-[#FFFCF5] text-[#5D5146] hover:border-[#C58B2B]'
                                }`}
                            >
                                <FlagIcon className="h-4 w-4" />
                                Tables complètes
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowInProgress((value) => !value)}
                                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black transition-all ${
                                    showInProgress
                                        ? 'border-[#1F5B45] bg-[#1F5B45] text-[#FFF8E8]'
                                        : 'border-[#D8C6AC] bg-[#FFFCF5] text-[#5D5146] hover:border-[#C58B2B]'
                                }`}
                            >
                                <ClockIcon className="h-4 w-4" />
                                Parties en cours
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {sortFilters.map((sort) => (
                                <button
                                    key={sort.value}
                                    type="button"
                                    onClick={() => setSortBy(sort.value)}
                                    className={`rounded-full border px-4 py-2 text-sm font-black transition-all ${
                                        sortBy === sort.value
                                            ? 'border-[#C58B2B] bg-[#F0D7A5] text-[#6B4308]'
                                            : 'border-[#D8C6AC] bg-[#FFFCF5] text-[#5D5146] hover:border-[#C58B2B]'
                                    }`}
                                >
                                    {sort.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {filteredLobbies.map(lobby => (
                        <LobbyTableCard
                            key={lobby.id}
                            lobby={lobby}
                            onJoin={joinLobby}
                            onPlayersClick={(id, playerNames) => setLobbyPlayerModal({
                                gameId: id,
                                players: playerNames.map(username => ({ username, score: 0, placement: null }))
                            })}
                        />
                    ))}
                </div>

                {filteredLobbies.length === 0 && (
                    <div className="mt-5 rounded-[24px] border border-dashed border-[#D8C6AC] bg-[#FFFCF5] px-6 py-9 text-center shadow-[0_10px_28px_rgba(43,31,20,0.04)]">
                        <SparklesIcon className="mx-auto mb-3 h-9 w-9 text-[#C58B2B]" />
                        <h3 className="text-xl font-black tracking-tight text-[#251C15]">Aucune table ne correspond aux filtres</h3>
                        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#766A5D]">
                            Le site doit rester vivant même quand la salle est vide. La bonne action est de créer une table ou d’élargir l’affichage.
                        </p>
                        <div className="mt-4 flex flex-wrap justify-center gap-3">
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="rounded-full border border-[#D8C6AC] bg-[#F8EEDB] px-5 py-3 text-sm font-black text-[#5D5146] transition-all hover:border-[#C58B2B]"
                            >
                                Réinitialiser les filtres
                            </button>
                            <button
                                type="button"
                                onClick={() => router.push(`/lobby/create/${crypto.randomUUID()}`)}
                                className="inline-flex items-center gap-2 rounded-full bg-[#1F5B45] px-5 py-3 text-sm font-black text-[#FFF8E8] transition-all hover:bg-[#174735]"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Créer une table
                            </button>
                        </div>
                    </div>
                )}

                {lobbyPlayerModal && (
                    <PlayerModal
                        gameId={lobbyPlayerModal.gameId}
                        players={lobbyPlayerModal.players}
                        onClose={() => setLobbyPlayerModal(null)}
                    />
                )}
            </section>
        </main>
    );
}

export default function LobbiesPage() {
    return (
        <Suspense>
            <LobbiesPageInner />
        </Suspense>
    );
}
