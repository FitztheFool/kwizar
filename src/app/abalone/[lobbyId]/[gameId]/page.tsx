'use client';

import { notFound } from 'next/navigation';
import { useGamePage } from '@/hooks/useGamePage';
import { useEloUpdate } from '@/hooks/useEloUpdate';
import { useAbalone, isBot } from '@/hooks/useAbalone';
import AbaloneBoard from '@/components/Abalone/Board';
import LoadingSpinner from '@/components/LoadingSpinner';
import GameWaitingScreen from '@/components/GameWaitingScreen';
import GameIcon from '@/components/GameIcon';
import TimerBar from '@/components/TimerBar';
import SurrenderButton from '@/components/SurrenderButton';
import GamePageHeader from '@/components/GamePageHeader';
import GameOverModal from '@/components/GameOverModal';
import GameScoreLeaderboard from '@/components/GameScoreLeaderboard';
import { TrophyIcon, XCircleIcon, CpuChipIcon } from '@heroicons/react/24/outline';

const WIN_EJECTED = 6;

function MarbleDot({ color }: { color: 0 | 1 }) {
    return <span className={`inline-block w-3 h-3 rounded-full border ${color === 0 ? 'bg-zinc-800 border-zinc-900' : 'bg-zinc-200 border-zinc-400'}`} />;
}

export default function AbalonePage() {
    const { status, router, me, lobbyId, isNotFound, setIsNotFound } = useGamePage();
    const myElo = useEloUpdate('abalone', me.userId);

    const { players, state, myColorIndex, isMyTurn, vsBot, inactivityUserId, inactivityEndsAt, move, surrender } = useAbalone({
        lobbyId,
        userId: me.userId,
        username: me.username ?? '',
        onNotFound: () => setIsNotFound(true),
    });

    if (status === 'loading') return <LoadingSpinner message="Vérification de la session..." />;
    if (isNotFound) notFound();

    if (!state || state.phase === 'waiting') return (
        <GameWaitingScreen gameType="abalone" gameName="Abalone" lobbyId={lobbyId} players={players} myUserId={me.userId} />
    );

    const player0 = players.find(p => p.colorIndex === 0);
    const player1 = players.find(p => p.colorIndex === 1);
    const winnerPlayer = state.winner !== null ? players.find(p => p.colorIndex === state.winner) : null;
    const iWon = state.winner === myColorIndex;
    const turnName = players.find(p => p.colorIndex === state.currentTurn)?.username ?? '…';

    const PlayerTag = ({ idx }: { idx: 0 | 1 }) => {
        const p = idx === 0 ? player0 : player1;
        if (!p) return null;
        const active = state.phase === 'playing' && state.currentTurn === idx;
        const warn = inactivityUserId === p.userId ? inactivityEndsAt : null;
        return (
            <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold ${active ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 ring-1 ring-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
                <MarbleDot color={idx} />
                {isBot(p) ? <CpuChipIcon className="w-3.5 h-3.5" /> : null}
                {p.username}
                <span className="text-[10px] opacity-70">· {WIN_EJECTED - state.ejected[idx === 0 ? 1 : 0]} à éjecter</span>
                {warn && <span className="text-red-500">⏳</span>}
            </span>
        );
    };

    return (
        <div className="flex-1 flex flex-col wood-table text-gray-900 dark:text-white">
            <GamePageHeader
                left={<><GameIcon gameType="abalone" className="w-5 h-5 text-gray-700 dark:text-gray-300" /><span className="font-bold">Abalone{vsBot && <span className="ml-2 text-xs font-normal text-indigo-600 dark:text-indigo-400">vs Bot</span>}</span></>}
                center={
                    <div className="flex items-center gap-2">
                        <PlayerTag idx={0} />
                        <span className="text-gray-400 dark:text-gray-600 text-xs">vs</span>
                        <PlayerTag idx={1} />
                    </div>
                }
                right={state.phase === 'playing' && <SurrenderButton onSurrender={surrender} />}
            />

            {state.phase === 'playing' && (
                <TimerBar
                    endsAt={state.turnStartedAt ? state.turnStartedAt + state.turnDuration * 1000 : null}
                    duration={state.turnDuration}
                    label={isMyTurn ? 'À toi de jouer' : vsBot && isBot(players.find(p => p.colorIndex === state.currentTurn)) ? 'Le bot réfléchit…' : `Tour de ${turnName}`}
                />
            )}

            <main className="flex-1 flex flex-col items-center justify-center gap-4 p-4 min-w-0">
                {myColorIndex !== null && (
                    <AbaloneBoard state={state} myColorIndex={myColorIndex} isMyTurn={isMyTurn} onMove={move} />
                )}
                {isMyTurn && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-sm">
                        Sélectionne 1 à 3 billes alignées, puis clique une flèche pour les déplacer (ou pousser l'adversaire).
                    </p>
                )}
            </main>

            {state.phase === 'finished' && (
                <GameOverModal
                    asModal
                    elo={myElo}
                    icon={iWon ? <TrophyIcon className="w-8 h-8 text-amber-500" /> : isBot(winnerPlayer) ? <CpuChipIcon className="w-8 h-8 text-indigo-400" /> : <XCircleIcon className="w-8 h-8 text-red-400" />}
                    title={iWon ? 'Victoire !' : isBot(winnerPlayer) ? 'Le bot gagne !' : `${winnerPlayer?.username ?? 'Adversaire'} gagne !`}
                    subtitle={state.reason === 'surrender' ? 'Abandon' : state.reason === 'afk' ? 'AFK' : '6 billes éjectées'}
                    onLobby={() => router.push(`/lobby/create/${lobbyId}`)}
                    onLeave={() => router.push('/')}
                >
                    <GameScoreLeaderboard
                        myUserId={me.userId}
                        entries={[player0, player1].filter(Boolean).sort((a, b) =>
                            (state.scores[b!.colorIndex] ?? 0) - (state.scores[a!.colorIndex] ?? 0)
                        ).map((p) => {
                            const isWinner = p!.userId === winnerPlayer?.userId;
                            const isLoserBySurrender = !isWinner && state.reason === 'surrender';
                            const isLoserByAfk = !isWinner && state.reason === 'afk';
                            const score = state.scores[p!.colorIndex] ?? 0;
                            return {
                                userId: p!.userId,
                                username: p!.username,
                                score: `${score} victoire${score !== 1 ? 's' : ''}`,
                                badges: [
                                    ...(isBot(p) ? ['Bot'] : []),
                                    ...(isLoserBySurrender ? ['Abandon'] : []),
                                    ...(isLoserByAfk ? ['AFK'] : []),
                                ],
                                disqualified: isLoserBySurrender || isLoserByAfk,
                            };
                        })}
                    />
                </GameOverModal>
            )}
        </div>
    );
}
