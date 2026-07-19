'use client';

import { useEffect, useMemo, useState } from 'react';
import { notFound } from 'next/navigation';
import { useGamePage } from '@/hooks/useGamePage';
import { useGameEnabledGuard } from '@/hooks/useGameEnabledGuard';
import GameUnavailable from '@/components/GameUnavailable';
import { useEloUpdate } from '@/hooks/useEloUpdate';
import { useBackgammon, isBot, BAR, OFF, type Move } from '@/hooks/useBackgammon';
import GameOverModal from '@/components/GameOverModal';
import GameScoreLeaderboard from '@/components/GameScoreLeaderboard';
import LoadingSpinner from '@/components/LoadingSpinner';
import GameWaitingScreen from '@/components/GameWaitingScreen';
import GameIcon from '@/components/GameIcon';
import TimerBar from '@/components/TimerBar';
import GamePageHeader from '@/components/GamePageHeader';
import SurrenderButton from '@/components/SurrenderButton';
import SpectatorBadge from '@/components/SpectatorBadge';
import PlayerLabel from '@/components/shared/PlayerLabel';
import { GameLogSidebar } from '@/components/GameLog';
import { TrophyIcon, XCircleIcon, CpuChipIcon } from '@heroicons/react/24/outline';

// Couleurs des pions : joueur 0 = anthracite, joueur 1 = ivoire.
const CHECKER_STYLE: Record<0 | 1, string> = {
    0: 'bg-gradient-to-br from-gray-700 to-gray-900 border-black/50 text-white',
    1: 'bg-gradient-to-br from-amber-50 to-amber-200 border-amber-300/70 text-amber-900',
};
const LABEL_BG: Record<0 | 1, string> = { 0: 'bg-gray-800', 1: 'bg-amber-200' };

/** Pile de pions sur une flèche (5 max affichés, le compte au-delà). */
function CheckerStack({ owner, count, top }: { owner: 0 | 1; count: number; top: boolean }) {
    const shown = Math.min(count, 5);
    return (
        <div className={`absolute inset-0 flex ${top ? 'flex-col' : 'flex-col-reverse'} items-center gap-[2px] p-[2px] pointer-events-none`}>
            {Array.from({ length: shown }, (_, i) => (
                <div
                    key={i}
                    style={{ height: '18.5%' }}
                    className={`aspect-square rounded-full border-2 shadow ${CHECKER_STYLE[owner]} flex items-center justify-center`}
                >
                    {i === shown - 1 && count > 5 && <span className="text-[0.65rem] font-bold">{count}</span>}
                </div>
            ))}
        </div>
    );
}

/** Une flèche du plateau (triangle + pions + surlignages). */
function PointView({ index, top, colorAlt, value, selectable, selected, isDest, isLast, onClick }: {
    index: number;
    top: boolean;
    colorAlt: boolean;
    value: number;
    selectable: boolean;
    selected: boolean;
    isDest: boolean;
    isLast: boolean;
    onClick: () => void;
}) {
    const owner: 0 | 1 | null = value > 0 ? 0 : value < 0 ? 1 : null;
    const clip = top ? 'polygon(0 0, 100% 0, 50% 92%)' : 'polygon(50% 8%, 100% 100%, 0 100%)';
    return (
        <div
            onClick={onClick}
            className={`relative flex-1 h-full min-w-0 select-none ${selectable || isDest ? 'cursor-pointer' : 'cursor-default'}`}
        >
            <div
                className={`absolute inset-0 ${colorAlt ? 'bg-amber-700 dark:bg-amber-800' : 'bg-stone-300 dark:bg-stone-600'} ${isLast ? 'opacity-90' : ''}`}
                style={{ clipPath: clip }}
            />
            {isLast && <div className="absolute inset-0 bg-emerald-400/20" style={{ clipPath: clip }} />}
            {owner !== null && <CheckerStack owner={owner} count={Math.abs(value)} top={top} />}
            {(selected || selectable) && (
                <div className={`absolute inset-0 ring-2 ring-inset rounded-sm ${selected ? 'ring-emerald-400' : 'ring-emerald-400/50'}`} />
            )}
            {isDest && (
                <div className={`absolute left-1/2 -translate-x-1/2 ${top ? 'bottom-2' : 'top-2'} w-3 h-3 rounded-full bg-emerald-400/90 shadow`} />
            )}
            <span className={`absolute ${top ? '-top-5' : '-bottom-5'} left-1/2 -translate-x-1/2 text-[0.6rem] text-amber-100/70`}>{index + 1}</span>
        </div>
    );
}

function DiceTray({ rolled, dice }: { rolled: number[]; dice: number[] }) {
    // Grise les dés déjà consommés (les occurrences restantes sont dans `dice`).
    const remaining = [...dice];
    return (
        <div className="flex items-center gap-2">
            {rolled.map((d, i) => {
                const idx = remaining.indexOf(d);
                const available = idx !== -1;
                if (available) remaining.splice(idx, 1);
                return (
                    <div key={i} className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center text-lg font-bold shadow
                        ${available ? 'bg-white text-gray-900 border-gray-300' : 'bg-gray-300/40 text-gray-400 border-gray-300/40 dark:bg-gray-700/40 dark:text-gray-500 dark:border-gray-600/40'}`}>
                        {d}
                    </div>
                );
            })}
        </div>
    );
}

export default function BackgammonPage() {
    const { status, router, me, lobbyId, isNotFound, setIsNotFound, modalDismissed, setModalDismissed } = useGamePage();
    const gameGuard = useGameEnabledGuard('backgammon');
    const myElo = useEloUpdate('backgammon', me.userId);

    const { players, gameState, myColorIndex, isMyTurn, spectator, vsBot, inactivityUserId, inactivityEndsAt, move, surrender } = useBackgammon({
        lobbyId,
        userId: me.userId,
        username: me.username ?? '',
        onNotFound: () => setIsNotFound(true),
        onModalReset: () => setModalDismissed(false),
    });

    const [selected, setSelected] = useState<number | null>(null); // origine (0-23 ou BAR)

    const movesByFrom = useMemo(() => {
        const map = new Map<number, Move[]>();
        for (const m of gameState?.legalMoves ?? []) {
            const arr = map.get(m.from);
            if (arr) arr.push(m); else map.set(m.from, [m]);
        }
        return map;
    }, [gameState?.legalMoves]);

    // Pion à la barre : l'entrée est obligatoire, on force la sélection.
    useEffect(() => {
        if (isMyTurn && myColorIndex !== null && (gameState?.bar[myColorIndex] ?? 0) > 0) setSelected(BAR);
    }, [isMyTurn, myColorIndex, gameState?.bar]);

    useEffect(() => {
        if (!isMyTurn) setSelected(null);
    }, [isMyTurn]);

    if (gameGuard === 'disabled') return <GameUnavailable />;
    if (status === 'loading') return <LoadingSpinner message="Vérification de la session..." />;
    if (isNotFound) notFound();

    if (!gameState || gameState.status === 'waiting') return (
        <GameWaitingScreen gameType="backgammon" gameName="Backgammon" lobbyId={lobbyId} players={players} myUserId={me.userId} />
    );

    const flip = myColorIndex === 1; // chaque joueur voit son jan intérieur en bas à droite
    const winnerPlayer = gameState.winner !== null ? players.find(p => p.colorIndex === gameState.winner) : null;
    const player0 = players.find(p => p.colorIndex === 0);
    const player1 = players.find(p => p.colorIndex === 1);
    const showSurrender = gameState.status === 'playing' && !spectator;
    const currentPlayer = players.find(p => p.colorIndex === gameState.currentTurn);

    const destinations = selected !== null ? (movesByFrom.get(selected) ?? []) : [];
    const destSet = new Set(destinations.map(m => m.to));
    const canBearOffNow = destSet.has(OFF);
    const lastMoveSet = new Set([gameState.lastMove?.from, gameState.lastMove?.to].filter(v => v != null));

    const playMoveTo = (to: number) => {
        // Plusieurs dés possibles pour la même destination (sortie) : on consomme le plus petit.
        const candidates = destinations.filter(m => m.to === to);
        if (candidates.length === 0 || selected === null) return;
        const m = candidates.reduce((a, b) => (a.die <= b.die ? a : b));
        move(m);
        setSelected(null);
    };

    const onPointClick = (p: number) => {
        if (!isMyTurn) return;
        if (selected !== null && destSet.has(p)) { playMoveTo(p); return; }
        const mustEnter = myColorIndex !== null && gameState.bar[myColorIndex] > 0;
        if (!mustEnter && movesByFrom.has(p)) { setSelected(p); return; }
        if (!mustEnter) setSelected(null);
    };

    // Ordre d'affichage (perspective joueur 0) : haut 12→23, bas 11→0 ; le flip échange les deux rangées.
    const topPoints = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
    const bottomPoints = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
    const rowTop = flip ? bottomPoints.slice().reverse() : topPoints;
    const rowBottom = flip ? topPoints.slice().reverse() : bottomPoints;

    const renderRow = (row: number[], top: boolean) => (
        <div className="flex flex-1 gap-[2px]">
            {row.flatMap((p, i) => {
                const cells = [];
                if (i === 6) cells.push(<div key={`gap-${top ? 't' : 'b'}`} className="w-6 sm:w-8 shrink-0" />);
                cells.push(
                    <PointView
                        key={p}
                        index={p}
                        top={top}
                        colorAlt={p % 2 === (top ? 0 : 1)}
                        value={gameState.points[p]}
                        selectable={isMyTurn && selected === null && movesByFrom.has(p)}
                        selected={selected === p}
                        isDest={destSet.has(p)}
                        isLast={lastMoveSet.has(p)}
                        onClick={() => onPointClick(p)}
                    />
                );
                return cells;
            })}
        </div>
    );

    const myBar = myColorIndex !== null ? gameState.bar[myColorIndex] : 0;

    return (
        <div className="flex-1 flex flex-col bg-stone-50 dark:bg-gray-950 text-gray-900 dark:text-white">
            <GamePageHeader
                game="backgammon"
                left={<><GameIcon gameType="backgammon" className="w-5 h-5 text-gray-700 dark:text-gray-300" /><span className="font-bold">Backgammon{vsBot && <span className="ml-2 text-xs font-normal text-indigo-600 dark:text-indigo-400">vs Bot</span>}</span>{spectator && <SpectatorBadge className="ml-2" />}</>}
                center={
                    <div className="flex items-center gap-2 text-sm">
                        {players.length === 2 && player0 && player1 ? (
                            <>
                                <PlayerLabel username={player0.username} active={gameState.status === 'playing' && gameState.currentTurn === 0} isBot={isBot(player0)} bgClass={LABEL_BG[0]} inactivityEndsAt={inactivityUserId === player0.userId ? inactivityEndsAt : null} />
                                <span className="text-gray-400 dark:text-gray-600">vs</span>
                                <PlayerLabel username={player1.username} active={gameState.status === 'playing' && gameState.currentTurn === 1} isBot={isBot(player1)} bgClass={LABEL_BG[1]} inactivityEndsAt={inactivityUserId === player1.userId ? inactivityEndsAt : null} />
                            </>
                        ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-xs">En attente de joueurs…</span>
                        )}
                    </div>
                }
                right={showSurrender && <SurrenderButton onSurrender={surrender} />}
            />

            {gameState.status === 'playing' && (
                <TimerBar
                    endsAt={gameState.turnStartedAt ? gameState.turnStartedAt + gameState.turnDuration * 1000 : null}
                    duration={gameState.turnDuration}
                    label={
                        gameState.noMoves
                            ? `${currentPlayer?.username ?? '…'} ne peut pas jouer — le tour passe…`
                            : isMyTurn
                                ? (myBar > 0 ? 'Votre tour — entrez depuis la barre' : 'Votre tour')
                                : vsBot && isBot(currentPlayer)
                                    ? 'Le bot réfléchit…'
                                    : `Tour de ${currentPlayer?.username ?? '…'}`
                    }
                />
            )}

            <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-4 p-4">
                <div className="hidden lg:block lg:w-72 shrink-0" aria-hidden />
                <div className="flex-1 flex flex-col items-center justify-center gap-4 min-w-0">

                    <DiceTray rolled={gameState.rolled} dice={gameState.dice} />

                    <div className="relative w-full max-w-3xl rounded-xl border-4 border-amber-900/80 bg-amber-900/90 dark:bg-amber-950 shadow-2xl p-3 sm:p-4">
                        <div className="flex flex-col h-[19rem] sm:h-[24rem] py-4">
                            {renderRow(rowTop, true)}
                            <div className="h-8 sm:h-10 shrink-0" />
                            {renderRow(rowBottom, false)}
                        </div>

                        {/* Barre centrale */}
                        <div
                            onClick={() => { if (isMyTurn && movesByFrom.has(BAR)) setSelected(BAR); }}
                            className={`absolute top-3 bottom-3 left-1/2 -translate-x-1/2 w-6 sm:w-8 rounded bg-amber-950/90 dark:bg-black/60 border border-amber-700/40 flex flex-col items-center justify-between py-2
                                ${selected === BAR ? 'ring-2 ring-emerald-400' : movesByFrom.has(BAR) && isMyTurn ? 'ring-2 ring-emerald-400/50 cursor-pointer' : ''}`}
                        >
                            {/* Pions à la barre : joueur 1 en haut, joueur 0 en bas (côté de leur ré-entrée). */}
                            <div className="flex flex-col items-center gap-[2px]">
                                {Array.from({ length: Math.min(gameState.bar[1], 3) }, (_, i) => (
                                    <div key={i} className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border ${CHECKER_STYLE[1]} flex items-center justify-center text-[0.55rem] font-bold`}>
                                        {i === 0 && gameState.bar[1] > 3 ? gameState.bar[1] : ''}
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col items-center gap-[2px]">
                                {Array.from({ length: Math.min(gameState.bar[0], 3) }, (_, i) => (
                                    <div key={i} className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border ${CHECKER_STYLE[0]} flex items-center justify-center text-[0.55rem] font-bold`}>
                                        {i === 0 && gameState.bar[0] > 3 ? gameState.bar[0] : ''}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sorties (bear-off) */}
                    <div className="w-full max-w-3xl flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <span className={`inline-block w-4 h-4 rounded-full border ${CHECKER_STYLE[0]}`} />
                            <span className="text-gray-600 dark:text-gray-400">{player0?.username ?? '…'} : {gameState.off[0]}/15 sortis</span>
                        </div>
                        <button
                            onClick={() => canBearOffNow && playMoveTo(OFF)}
                            disabled={!canBearOffNow}
                            className={`px-4 py-2 rounded-lg border-2 font-semibold transition
                                ${canBearOffNow
                                    ? 'border-emerald-400 bg-emerald-400/15 text-emerald-600 dark:text-emerald-300 cursor-pointer animate-pulse'
                                    : 'border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-default'}`}
                        >
                            Sortir le pion
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600 dark:text-gray-400">{player1?.username ?? '…'} : {gameState.off[1]}/15 sortis</span>
                            <span className={`inline-block w-4 h-4 rounded-full border ${CHECKER_STYLE[1]}`} />
                        </div>
                    </div>
                </div>

                <GameLogSidebar entries={gameState.log ?? []} />
            </main>

            {gameState.status === 'finished' && !modalDismissed && (
                <GameOverModal
                    elo={myElo} spectator={spectator}
                    icon={winnerPlayer?.userId === me.userId ? <TrophyIcon className="w-8 h-8 text-amber-500" /> : isBot(winnerPlayer) ? <CpuChipIcon className="w-8 h-8 text-indigo-400" /> : <XCircleIcon className="w-8 h-8 text-red-400" />}
                    title={
                        (winnerPlayer?.userId === me.userId
                            ? 'Vous avez gagné !'
                            : isBot(winnerPlayer)
                                ? 'Le bot gagne !'
                                : `${winnerPlayer?.username ?? 'Adversaire'} gagne !`)
                        + (gameState.gammon === 'backgammon' ? ' (Backgammon)' : gameState.gammon === 'gammon' ? ' (Gammon)' : '')
                    }
                    reason={gameState.reason ?? undefined}
                    onLobby={() => router.push(`/lobby/create/${lobbyId}`)}
                    onLeave={() => router.push('/')}
                    onClose={() => setModalDismissed(true)}
                    asModal
                >
                    <GameScoreLeaderboard
                        myUserId={me.userId}
                        entries={[player0, player1].filter(Boolean).sort((a, b) =>
                            (gameState.scores[b!.colorIndex] ?? 0) - (gameState.scores[a!.colorIndex] ?? 0)
                        ).map((p) => {
                            const isWinner = p!.userId === winnerPlayer?.userId;
                            const isLoserBySurrender = !isWinner && gameState.reason === 'surrender';
                            const isLoserByAfk = !isWinner && gameState.reason === 'afk';
                            const bot = isBot(p);
                            return {
                                userId: p!.userId,
                                username: p!.username,
                                score: `${gameState.scores[p!.colorIndex] ?? 0} victoire${(gameState.scores[p!.colorIndex] ?? 0) !== 1 ? 's' : ''}`,
                                badges: [
                                    ...(bot ? ['Bot'] : []),
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
