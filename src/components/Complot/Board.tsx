'use client';

import { useState } from 'react';
import type { ComplotState, ActionType, Character } from '@/hooks/useComplot';

const CHAR: Record<Character, { label: string; color: string }> = {
    duc: { label: 'Duc', color: 'bg-purple-600' },
    assassin: { label: 'Assassin', color: 'bg-zinc-800' },
    comtesse: { label: 'Comtesse', color: 'bg-rose-600' },
    capitaine: { label: 'Capitaine', color: 'bg-sky-600' },
    ambassadeur: { label: 'Ambassadeur', color: 'bg-emerald-600' },
};
const PLAYER_COLOR = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea', '#0891b2'];

const ACTION_LABEL: Record<ActionType, string> = {
    revenu: 'Revenu (+1)', aide: 'Aide étrangère (+2)', coup: 'Coup (−7)',
    taxe: 'Taxe · Duc (+3)', assassinat: 'Assassinat · Assassin (−3)', vol: 'Voler · Capitaine', echange: 'Échanger · Ambassadeur',
};
const NEEDS_TARGET: ActionType[] = ['coup', 'assassinat', 'vol'];

interface Actions {
    action: (t: ActionType, target?: number | null) => void;
    passReact: () => void;
    challenge: () => void;
    block: (c: Character) => void;
    challengeBlock: () => void;
    lose: (i: number) => void;
    exchange: (keep: number[]) => void;
}

export default function ComplotBoard({ state, myIndex, fns }: { state: ComplotState; myIndex: number | null; fns: Actions }) {
    const [pendingAction, setPendingAction] = useState<ActionType | null>(null);
    const me = myIndex != null ? state.players[myIndex] : null;
    const isMyTurn = state.phase === 'action' && state.currentTurn === myIndex;

    const myCoins = me?.coins ?? 0;
    const mustCoup = myCoins >= 10;

    const startAction = (t: ActionType) => {
        if (NEEDS_TARGET.includes(t)) setPendingAction(t);
        else { fns.action(t, null); setPendingAction(null); }
    };
    const pickTarget = (idx: number) => { if (pendingAction) { fns.action(pendingAction, idx); setPendingAction(null); } };

    // éligibilité aux réactions
    const p = state.pending;
    const respondedMe = p && myIndex != null ? p.responded[myIndex] : true;
    const canReactBlock = state.phase === 'block' && p && myIndex != null && !respondedMe && me?.alive;
    const canChallengeBlock = state.phase === 'challengeBlock' && p && myIndex != null && !respondedMe && me?.alive;
    const canChallengeAction = canReactBlock && !!p?.claim;
    const blockChars: Character[] = !p ? [] :
        p.type === 'aide' ? ['duc'] :
            p.type === 'assassinat' && myIndex === p.target ? ['comtesse'] :
                p.type === 'vol' && myIndex === p.target ? ['capitaine', 'ambassadeur'] : [];

    const name = (i: number) => state.players[i]?.username ?? `J${i + 1}`;

    return (
        <div className="w-full max-w-3xl flex flex-col gap-4">
            {/* Joueurs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {state.players.map((pl) => {
                    const isTurn = state.phase === 'action' && state.currentTurn === pl.colorIndex;
                    const targetable = pendingAction != null && pl.colorIndex !== myIndex && pl.alive;
                    return (
                        <button key={pl.colorIndex}
                            disabled={!targetable}
                            onClick={() => targetable && pickTarget(pl.colorIndex)}
                            className={`relative text-left rounded-xl p-2.5 border-2 transition-all
                                ${pl.alive ? 'bg-white/70 dark:bg-zinc-800/70' : 'bg-zinc-200/50 dark:bg-zinc-900/50 opacity-60'}
                                ${isTurn ? 'border-amber-400 ring-2 ring-amber-300/50' : 'border-transparent'}
                                ${targetable ? 'cursor-pointer ring-2 ring-red-500 animate-pulse hover:-translate-y-0.5' : ''}`}>
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: PLAYER_COLOR[pl.colorIndex] }} />
                                <span className="text-xs font-bold truncate flex-1">{pl.username}{pl.colorIndex === myIndex && ' (moi)'}</span>
                                <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400">{pl.coins}●</span>
                            </div>
                            <div className="flex gap-1">
                                {pl.cards.map((c, ci) => (
                                    <span key={ci} className={`flex-1 h-9 rounded-md flex items-center justify-center text-[8px] font-black uppercase text-white text-center leading-tight px-0.5
                                        ${c.revealed ? `${CHAR[c.char!]?.color ?? 'bg-zinc-500'} opacity-60 line-through` : c.char ? CHAR[c.char].color : 'bg-zinc-400 dark:bg-zinc-600'}`}>
                                        {c.revealed ? CHAR[c.char!]?.label : c.char ? CHAR[c.char].label : '?'}
                                    </span>
                                ))}
                            </div>
                            {!pl.alive && <span className="absolute top-1 right-1 text-[9px] font-bold text-red-500">éliminé</span>}
                        </button>
                    );
                })}
            </div>

            {/* Bandeau d'état */}
            <div className="text-center text-sm">
                {state.phase === 'action' && (isMyTurn ? <span className="font-bold text-amber-600 dark:text-amber-400">À toi de jouer{mustCoup && ' — tu dois faire un Coup (≥10●)'}</span> : <span className="text-gray-500">Tour de {name(state.currentTurn)}</span>)}
                {state.phase === 'block' && p && <span className="text-gray-600 dark:text-gray-300">{name(p.actor)} tente <b>{p.type}</b>{p.claim ? ` (${CHAR[p.claim].label})` : ''}{p.target != null ? ` → ${name(p.target)}` : ''}</span>}
                {state.phase === 'challengeBlock' && p && p.blocker != null && <span className="text-gray-600 dark:text-gray-300">{name(p.blocker)} bloque avec <b>{CHAR[p.blockClaim!].label}</b></span>}
                {state.phase === 'lose' && <span className="text-rose-600 dark:text-rose-400">{state.chooser === myIndex ? 'Tu perds une influence — choisis une carte' : `${name(state.chooser ?? 0)} perd une influence…`}</span>}
                {state.phase === 'exchange' && <span className="text-emerald-600 dark:text-emerald-400">{state.chooser === myIndex ? 'Choisis les cartes à garder' : `${name(state.chooser ?? 0)} échange…`}</span>}
            </div>

            {/* Panneau d'action */}
            {isMyTurn && (
                <div className="flex flex-wrap gap-2 justify-center">
                    {pendingAction ? (
                        <div className="text-sm text-gray-500 flex items-center gap-2">Choisis une cible…
                            <button onClick={() => setPendingAction(null)} className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-700 text-xs">Annuler</button>
                        </div>
                    ) : (['revenu', 'aide', 'taxe', 'vol', 'echange', 'assassinat', 'coup'] as ActionType[]).map(a => {
                        const disabled = (mustCoup && a !== 'coup') || (a === 'coup' && myCoins < 7) || (a === 'assassinat' && myCoins < 3);
                        return (
                            <button key={a} onClick={() => startAction(a)} disabled={disabled}
                                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold disabled:opacity-40 transition">
                                {ACTION_LABEL[a]}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Réactions */}
            {(canReactBlock || canChallengeBlock) && (
                <div className="flex flex-wrap gap-2 justify-center items-center p-3 rounded-xl bg-black/5 dark:bg-white/5">
                    <button onClick={fns.passReact} className="px-3 py-1.5 rounded-lg bg-zinc-300 dark:bg-zinc-700 text-xs font-bold">Passer</button>
                    {canChallengeAction && <button onClick={fns.challenge} className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold">Douter</button>}
                    {canChallengeBlock && <button onClick={fns.challengeBlock} className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold">Douter du blocage</button>}
                    {canReactBlock && blockChars.map(c => (
                        <button key={c} onClick={() => fns.block(c)} className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold">Bloquer ({CHAR[c].label})</button>
                    ))}
                </div>
            )}

            {/* Perte d'influence */}
            {state.phase === 'lose' && state.chooser === myIndex && me && (
                <div className="flex gap-2 justify-center">
                    {me.cards.map((c, ci) => !c.revealed && (
                        <button key={ci} onClick={() => fns.lose(ci)}
                            className={`px-4 py-3 rounded-lg text-white font-bold text-sm ${c.char ? CHAR[c.char].color : 'bg-zinc-500'} hover:brightness-110`}>
                            Révéler {c.char ? CHAR[c.char].label : '?'}
                        </button>
                    ))}
                </div>
            )}

            {/* Échange (Ambassadeur) */}
            {state.phase === 'exchange' && state.chooser === myIndex && me && (
                <ExchangePanel me={me} draw={state.exchangeDraw} onKeep={fns.exchange} />
            )}
        </div>
    );
}

function ExchangePanel({ me, draw, onKeep }: { me: ComplotState['players'][number]; draw: Character[]; onKeep: (keep: number[]) => void }) {
    const live = me.cards.filter(c => !c.revealed).map(c => c.char!) as Character[];
    const pool: Character[] = [...live, ...draw];
    const need = live.length;
    const [sel, setSel] = useState<number[]>([]);
    const toggle = (i: number) => setSel(s => s.includes(i) ? s.filter(x => x !== i) : s.length < need ? [...s, i] : s);
    return (
        <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-black/5 dark:bg-white/5">
            <p className="text-xs text-gray-500">Garde {need} carte{need > 1 ? 's' : ''}</p>
            <div className="flex gap-2 flex-wrap justify-center">
                {pool.map((c, i) => (
                    <button key={i} onClick={() => toggle(i)}
                        className={`px-3 py-3 rounded-lg text-white font-bold text-xs ${CHAR[c].color} ${sel.includes(i) ? 'ring-2 ring-white scale-105' : 'opacity-70'}`}>
                        {CHAR[c].label}
                    </button>
                ))}
            </div>
            <button disabled={sel.length !== need} onClick={() => onKeep(sel)}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-40">Valider</button>
        </div>
    );
}
