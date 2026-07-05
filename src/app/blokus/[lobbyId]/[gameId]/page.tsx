'use client';

import { notFound } from 'next/navigation';
import { useGamePage } from '@/hooks/useGamePage';
import { useGameEnabledGuard } from '@/hooks/useGameEnabledGuard';
import GameUnavailable from '@/components/GameUnavailable';
import { useEloUpdate } from '@/hooks/useEloUpdate';
import { useBlokus, isBot } from '@/hooks/useBlokus';
import BlokusBoard from '@/components/Blokus/Board';
import { COLORS } from '@/components/Blokus/pieces';
import LoadingSpinner from '@/components/LoadingSpinner';
import GameWaitingScreen from '@/components/GameWaitingScreen';
import GameIcon from '@/components/GameIcon';
import TimerBar from '@/components/TimerBar';
import SurrenderButton from '@/components/SurrenderButton';
import GamePageHeader from '@/components/GamePageHeader';
import GameOverModal from '@/components/GameOverModal';
import SpectatorBadge from '@/components/SpectatorBadge';
import { GameLogSidebar } from '@/components/GameLog';
import { TrophyIcon, CpuChipIcon } from '@heroicons/react/24/outline';

export default function BlokusPage() {
    const { status, router, me, lobbyId, isNotFound, setIsNotFound } = useGamePage();
    const gameGuard = useGameEnabledGuard('blokus');
    const myElo = useEloUpdate('blokus', me.userId);

    const { players, state, myColorIndex, isMyTurn, spectator, vsBot, inactivityUserId, inactivityEndsAt, move, surrender } = useBlokus({
        lobbyId,
        userId: me.userId,
        onNotFound: () => setIsNotFound(true),
    });

    if (gameGuard === 'disabled') return <GameUnavailable />;
    if (status === 'loading') return <LoadingSpinner message="Vérification de la session..." />;
    if (isNotFound) notFound();

    if (!state || state.phase === 'waiting') return (
        <GameWaitingScreen gameType="blokus" gameName="Blokus" lobbyId={lobbyId} players={players} myUserId={me.userId} />
    );

    // Duo : un joueur contrôle 2 couleurs. Propriétaire d'une couleur + score joueur = somme de ses couleurs.
    const colorOwner = (ci: number) => players.find(p => (p.colorIndices ?? [p.colorIndex]).includes(ci));
    const playerScore = (p: typeof players[number]) => (p.colorIndices ?? [p.colorIndex]).reduce((s, c) => s + state.scores[c], 0);
    const numColors = state.scores.length;

    const turnName = colorOwner(state.currentTurn)?.username ?? '…';
    const turnIsBot = isBot(colorOwner(state.currentTurn));

    // classement final par score joueur décroissant
    const ranking = [...players].sort((a, b) => playerScore(b) - playerScore(a));
    const myPlayer = players.find(p => p.userId === me.userId);
    const myRank = ranking.findIndex(p => p.userId === me.userId);
    const iWon = state.phase === 'finished' && myRank === 0;

    const PlayerTag = ({ colorIndex }: { colorIndex: number }) => {
        const p = colorOwner(colorIndex);
        if (!p) return null;
        const active = state.phase === 'playing' && state.currentTurn === colorIndex;
        const warn = inactivityUserId === p.userId ? inactivityEndsAt : null;
        return (
            <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold ${active ? 'ring-1 ring-amber-400 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200' : 'text-gray-500 dark:text-gray-400'}`}>
                <span className="inline-block w-3 h-3 rounded-sm border border-black/30" style={{ background: COLORS[colorIndex] }} />
                {isBot(p) ? <CpuChipIcon className="w-3.5 h-3.5" /> : null}
                <span className="max-w-[6rem] truncate">{p.username}</span>
                <span className="text-[10px] opacity-70">· {state.scores[colorIndex]}</span>
                {state.passed[colorIndex] && state.phase === 'playing' && <span className="text-[10px] text-red-400">·fini</span>}
                {warn && <span className="text-red-500">⏳</span>}
            </span>
        );
    };

    return (
        <div className="flex-1 flex flex-col bg-stone-50 dark:bg-gray-950 text-gray-900 dark:text-white">
            <GamePageHeader
                left={<><GameIcon gameType="blokus" className="w-5 h-5 text-gray-700 dark:text-gray-300" /><span className="font-bold">Blokus{vsBot && <span className="ml-2 text-xs font-normal text-indigo-600 dark:text-indigo-400">vs Bot</span>}</span>{spectator && <SpectatorBadge className="ml-2" />}</>}
                center={<div className="flex items-center gap-1.5 flex-wrap justify-center">{Array.from({ length: numColors }, (_, ci) => <PlayerTag key={ci} colorIndex={ci} />)}</div>}
                right={state.phase === 'playing' && !spectator && <SurrenderButton onSurrender={surrender} />}
            />

            {state.phase === 'playing' && state.turnDuration > 0 && (
                <TimerBar
                    endsAt={state.turnStartedAt ? state.turnStartedAt + state.turnDuration * 1000 : null}
                    duration={state.turnDuration}
                    label={isMyTurn ? 'À toi de jouer' : turnIsBot ? 'Le bot réfléchit…' : `Tour de ${turnName}`}
                />
            )}

            <main className="flex-1 flex flex-col lg:flex-row items-start justify-center gap-4 p-3 min-w-0">
                <div className="flex-1 flex justify-center min-w-0 w-full">
                    {(myColorIndex !== null || spectator) && (
                        <BlokusBoard state={state} myColorIndex={myColorIndex ?? 0} isMyTurn={isMyTurn} onMove={move} />
                    )}
                </div>
                <GameLogSidebar entries={state.log ?? []} />
            </main>

            {state.phase === 'finished' && (
                <GameOverModal
                    asModal
                    elo={myElo} spectator={spectator}
                    icon={<TrophyIcon className={`w-8 h-8 ${iWon ? 'text-amber-500' : 'text-gray-400'}`} />}
                    title={iWon ? 'Victoire !' : `${myRank + 1}ᵉ place`}
                    subtitle={spectator ? undefined : `Tu poses ${myPlayer ? playerScore(myPlayer) : 0} cases`}
                    onLobby={() => router.push(`/lobby/create/${lobbyId}`)}
                    onLeave={() => router.push('/')}
                >
                    <ol className="space-y-1.5 mt-1">
                        {ranking.map((p, i) => {
                            const cis = p.colorIndices ?? [p.colorIndex];
                            return (
                                <li key={p.userId} className={`flex items-center gap-2 text-sm ${p.userId === me.userId ? 'font-bold' : ''}`}>
                                    <span className="w-5 text-right opacity-60">{i + 1}.</span>
                                    <span className="flex gap-0.5">
                                        {cis.map(c => <span key={c} className="inline-block w-3 h-3 rounded-sm border border-black/30" style={{ background: COLORS[c] }} />)}
                                    </span>
                                    {isBot(p) && <CpuChipIcon className="w-3.5 h-3.5 text-indigo-400" />}
                                    <span className="flex-1 truncate">{p.username}</span>
                                    {p.surrendered
                                        ? <span className="text-[10px] bg-orange-500/30 text-orange-400 px-1.5 py-0.5 rounded shrink-0">Abandon</span>
                                        : p.afk && <span className="text-[10px] bg-red-500/30 text-red-400 px-1.5 py-0.5 rounded shrink-0">AFK</span>}
                                    <span className="tabular-nums">{playerScore(p)} cases</span>
                                </li>
                            );
                        })}
                    </ol>
                </GameOverModal>
            )}
        </div>
    );
}
