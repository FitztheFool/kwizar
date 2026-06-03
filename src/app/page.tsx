'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRightIcon,
  PlayIcon,
  PlusIcon,
  UsersIcon,
  FireIcon,
  RectangleGroupIcon,
} from '@heroicons/react/24/outline';

import { GAME_CONFIG } from '@/lib/gameConfig';
import GameCard from '@/components/GameCard';
import LobbyCard from '@/components/LobbyCard';
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

function getGameKeyFromLobby(gameType: string): string | null {
  const normalized = gameType.toUpperCase();

  const entry = Object.entries(GAME_CONFIG).find(([, config]) => {
    return config.gameType.toUpperCase() === normalized;
  });

  return entry?.[0] ?? null;
}

export default function HomePage() {
  const [lobbyCode, setLobbyCode] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [popularGames, setPopularGames] = useState<string[]>(FALLBACK_POPULAR_GAMES);
  const [lobbies, setLobbies] = useState<Lobby[]>([]);

  const { socket, connected } = useLobbySocket();

  const nbJeux = Object.keys(GAME_CONFIG).length;

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

  const highlightedLobbies = useMemo(() => {
    return [...lobbies]
      .sort((a, b) => {
        const aRatio = a.currentPlayers / Math.max(a.maxPlayers, 1);
        const bRatio = b.currentPlayers / Math.max(b.maxPlayers, 1);

        if (a.status !== b.status) {
          return a.status === 'waiting' ? -1 : 1;
        }

        return bRatio - aRatio;
      })
      .slice(0, 4);
  }, [lobbies]);

  const liveLobbyCount = lobbies.length;

  const handleJoinLobby = (lobbyId: string) => {
    window.location.href = `/lobby/create/${lobbyId}`;
  };

  const handlePlayersClick = () => {};

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-gray-950">
      <section className="relative overflow-hidden border-b border-felt-900/40 bg-gradient-to-br from-felt-900 via-felt-800 to-emerald-950">
        <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_20%_20%,#f59e0b,transparent_28%),radial-gradient(circle_at_80%_10%,#ffffff,transparent_24%),radial-gradient(circle_at_70%_80%,#10b981,transparent_30%)]" />

        <div className="relative max-w-6xl mx-auto px-6 py-14 md:py-20">
          <div className="grid md:grid-cols-[1.4fr_0.8fr] gap-10 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/80 mb-4">
                Jeux rapides, lobbies ouverts, classement vivant
              </p>

              <h1 className="font-display text-4xl md:text-6xl font-semibold text-amber-50 leading-[1.02] tracking-tight mb-5">
                Kwizar, une aire de jeu{' '}
                <span className="italic text-primary-300">pour tout le monde !</span>
              </h1>

              <p className="max-w-2xl text-base md:text-lg text-amber-50/75 leading-relaxed mb-7">
                Rejoins une table, lance une partie entre amis ou découvre les jeux qui tournent le plus en ce moment.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/lobby/all"
                  className="px-5 py-2.5 bg-primary-500 hover:bg-primary-400 text-stone-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-black/30 hover:-translate-y-px active:translate-y-0"
                >
                  <PlayIcon className="w-4 h-4 inline mr-1.5" />
                  Voir les lobbies
                </Link>

                <Link
                  href={`/lobby/create/${lobbyCode}`}
                  className="px-5 py-2.5 bg-amber-50/10 hover:bg-amber-50/20 text-amber-50 font-bold text-sm rounded-xl border border-amber-100/30 backdrop-blur-sm transition-all hover:-translate-y-px active:translate-y-0"
                >
                  <PlusIcon className="w-4 h-4 inline mr-1.5" />
                  Créer un lobby
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:justify-self-end">
              {[
                { value: fmt(nbJeux), label: 'jeux' },
                { value: stats ? fmt(stats.parties) : '—', label: 'parties' },
                { value: stats ? fmt(stats.points) : '—', label: 'points' },
                { value: fmt(liveLobbyCount), label: 'lobbies' },
              ].map(({ value, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-amber-100/15 bg-stone-950/25 backdrop-blur-sm px-5 py-5 min-w-[120px] text-center shadow-inner"
                >
                  <span className="font-display text-3xl font-bold text-amber-50">{value}</span>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-amber-200/60">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 py-10 md:py-14 space-y-14">
        <section>
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-2">
                <FireIcon className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">
                  Tendance
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                Les jeux les plus joués
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Sélection courte. La home ne doit pas devenir un catalogue.
              </p>
            </div>

            <Link
              href="/lobby/all"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-bold text-primary-700 dark:text-primary-300 hover:underline"
            >
              Tous les jeux
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {popularGames.map((key) => {
              const mode = GAME_CONFIG[key as keyof typeof GAME_CONFIG]?.mode ?? 'both';

              return (
                <GameCard
                  key={key}
                  gameKey={key}
                  mode={mode}
                />
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-felt-700 dark:text-felt-300 mb-2">
                <UsersIcon className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">
                  En direct
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                Lobbies en cours
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Même les tables complètes ou déjà lancées restent visibles pour donner de la vie au site.
              </p>
            </div>

            <Link
              href="/lobby/all?showFull=1"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-bold text-primary-700 dark:text-primary-300 hover:underline"
            >
              Voir tous les lobbies
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {highlightedLobbies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {highlightedLobbies.map((lobby) => (
                <LobbyCard
                  key={lobby.id}
                  lobby={lobby}
                  onJoin={handleJoinLobby}
                  onPlayersClick={handlePlayersClick}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 p-8 text-center">
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
                Aucun lobby visible pour le moment
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                La page garde quand même l’entrée rapide vers la création de lobby.
              </p>
              <Link
                href={`/lobby/create/${lobbyCode}`}
                className="inline-flex items-center px-5 py-2.5 bg-primary-500 hover:bg-primary-400 text-stone-950 font-bold text-sm rounded-xl transition-all"
              >
                <PlusIcon className="w-4 h-4 mr-1.5" />
                Créer le premier lobby
              </Link>
            </div>
          )}
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-amber-100/20 bg-gradient-to-br from-felt-900 via-emerald-900 to-stone-950 px-6 py-8 md:px-10 md:py-10 shadow-xl">
          <div className="absolute inset-0 opacity-[0.10] bg-[radial-gradient(circle_at_15%_30%,#f59e0b,transparent_28%),radial-gradient(circle_at_85%_70%,#ffffff,transparent_22%)]" />

          <div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <div className="flex items-center gap-2 text-amber-200/80 mb-3">
                <RectangleGroupIcon className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">
                  Catalogue complet
                </span>
              </div>

              <h2 className="font-display text-3xl md:text-4xl font-semibold text-amber-50 leading-tight mb-3">
                Tous les jeux restent accessibles.
              </h2>

              <p className="max-w-2xl text-sm md:text-base text-amber-50/70 leading-relaxed">
                La home montre le vivant. Le catalogue complet reste à part pour éviter de noyer le visiteur dès l’arrivée.
              </p>
            </div>

            <Link
              href="/lobby/all"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-50 text-stone-950 hover:bg-primary-300 font-black text-sm rounded-xl transition-all shadow-lg shadow-black/25"
            >
              Voir la liste complète
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}