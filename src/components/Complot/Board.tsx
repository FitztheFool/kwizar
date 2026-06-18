'use client';

import { useState } from 'react';
import type { ComplotState, ActionType, Character, ComplotCard } from '@/hooks/useComplot';

const CHAR: Record<Character, { label: string; color: string; accent: string; img: string }> = {
    duc: { label: 'Duc', color: 'bg-purple-600', accent: '#7c3aed', img: '/complot/duc.png' },
    assassin: { label: 'Assassin', color: 'bg-zinc-800', accent: '#3f3f46', img: '/complot/assassin.png' },
    comtesse: { label: 'Comtesse', color: 'bg-rose-600', accent: '#e11d48', img: '/complot/comtesse.png' },
    capitaine: { label: 'Capitaine', color: 'bg-sky-600', accent: '#0284c7', img: '/complot/capitaine.png' },
    ambassadeur: { label: 'Ambassadeur', color: 'bg-emerald-600', accent: '#059669', img: '/complot/ambassadeur.png' },
};
const PLAYER_COLOR = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea', '#0891b2'];

/** Une carte personnage — parchemin, dos illustré, croix rouge si révélée/éliminée. */
function CharCard({ card, small }: { card: ComplotCard; small?: boolean }) {
    const meta = card.char ? CHAR[card.char] : null;
    const size = small ? 'w-14 h-20' : 'w-20 h-28';
    return (
        <div className={`relative ${size} rounded-lg overflow-hidden shadow-md border border-amber-950/40 select-none`}>
            {/* Fond parchemin */}
            <div className="absolute inset-0 bg-[#efe3c8]"
                style={{ backgroundImage: 'radial-gradient(rgba(120,90,40,0.06) 1px, transparent 1px)', backgroundSize: '5px 5px' }} />
            {meta ? (
                // Carte visible (la mienne, ou révélée)
                <div className="absolute inset-0 flex flex-col">
                    {/* Illustration du personnage (le dégradé reste en fallback derrière) */}
                    <div className="relative h-[68%]" style={{ background: `linear-gradient(160deg, ${meta.accent}, ${meta.accent}cc)` }}>
                        <img src={meta.img} alt={meta.label} draggable={false}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                        {/* liseré bas pour fondre l'image dans le bandeau nom */}
                        <div className="absolute bottom-0 inset-x-0 h-2 bg-gradient-to-t from-[#efe3c8] to-transparent" />
                    </div>
                    <div className="flex-1 flex items-center justify-center px-0.5">
                        <span className="text-[10px] font-black uppercase tracking-tight text-center leading-none text-stone-800">{meta.label}</span>
                    </div>
                </div>
            ) : (
                // Dos de carte (adversaire, rôle inconnu) : vivante ou morte selon revealed
                <img src={card.revealed ? '/complot/carte-morte.png' : '/complot/carte.png'}
                    alt={card.revealed ? 'Carte perdue' : 'Carte cachée'} draggable={false}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            )}
            {/* Croix rouge — uniquement pour une carte au rôle connu (portrait barré) */}
            {card.revealed && meta && (
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden>
                    <line x1="8" y1="8" x2="92" y2="92" stroke="#b91c1c" strokeWidth="9" strokeLinecap="round" />
                    <line x1="92" y1="8" x2="8" y2="92" stroke="#b91c1c" strokeWidth="9" strokeLinecap="round" />
                </svg>
            )}
        </div>
    );
}

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

    // Disposition circulaire : on place les joueurs sur une ellipse, "moi" en bas.
    const N = state.players.length;
    const ordered = myIndex != null
        ? [...state.players.slice(myIndex), ...state.players.slice(0, myIndex)]
        : state.players;

    return (
        <div className="w-full max-w-3xl flex flex-col gap-4 pt-8 sm:pt-10">
            {/* Table ronde : joueurs autour de la pioche centrale */}
            <div className="relative w-full aspect-[16/11] sm:aspect-[16/9]">
                {/* Pioche centrale */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                    <div className="relative w-20 h-28">
                        {[3, 2, 1, 0].map(d => (
                            <div key={d} className="absolute w-20 h-28 rounded-lg border border-amber-950/40 shadow"
                                style={{ top: -d, left: d, background: 'repeating-linear-gradient(45deg, #6f4528, #6f4528 4px, #7d4f2e 4px, #7d4f2e 8px)' }} />
                        ))}
                        <span className="absolute inset-0 flex items-center justify-center">
                            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-200 text-amber-900 text-2xl font-black shadow-md ring-2 ring-amber-900/40">£</span>
                        </span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-100/90 drop-shadow">Pioche ({state.deckCount})</span>
                </div>

                {ordered.map((pl, slot) => {
                    // Angle : "moi" (slot 0) en bas, puis sens horaire.
                    const angle = (Math.PI / 2) + (slot / N) * 2 * Math.PI;
                    const x = 50 + Math.cos(angle) * 42;
                    const y = 50 + Math.sin(angle) * 40;
                    const isTurn = state.phase === 'action' && state.currentTurn === pl.colorIndex;
                    const targetable = pendingAction != null && pl.colorIndex !== myIndex && pl.alive;
                    const isMe = pl.colorIndex === myIndex;
                    return (
                        <button key={pl.colorIndex}
                            disabled={!targetable}
                            onClick={() => targetable && pickTarget(pl.colorIndex)}
                            style={{ left: `${x}%`, top: `${y}%` }}
                            className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 border-2 transition-all
                                ${isTurn ? 'border-amber-400 bg-amber-500/15 ring-2 ring-amber-300/40' : 'border-transparent'}
                                ${!pl.alive ? 'opacity-50' : ''}
                                ${targetable ? 'cursor-pointer ring-2 ring-red-500 animate-pulse hover:-translate-y-[calc(50%+2px)]' : ''}`}>
                            {/* Nom + pièces */}
                            <div className="flex items-center gap-1.5 max-w-[8rem]">
                                <span className="text-[11px] font-black truncate drop-shadow"
                                    style={{ color: PLAYER_COLOR[pl.colorIndex] }}>
                                    {pl.username}{isMe && ' (moi)'}
                                </span>
                                <span className="text-[11px] font-mono font-black text-amber-300 drop-shadow whitespace-nowrap">£{pl.coins}</span>
                            </div>
                            {/* Cartes : les miennes visibles, celles des autres cachées (sauf révélées) */}
                            <div className="flex gap-1">
                                {pl.cards.map((c, ci) => (
                                    <CharCard key={ci} card={isMe || c.revealed ? c : { char: null, revealed: false }} />
                                ))}
                            </div>
                            {!pl.alive && <span className="text-[9px] font-bold text-red-400 drop-shadow">éliminé</span>}
                        </button>
                    );
                })}
            </div>

            {/* Bandeau d'état — bulle lisible sur le bois */}
            <div className="text-center text-sm">
                <span className="inline-block rounded-full bg-black/55 backdrop-blur-sm px-4 py-1.5 text-white shadow-lg">
                    {state.phase === 'action' && (isMyTurn ? <span className="font-bold text-amber-300">À toi de jouer{mustCoup && ' — tu dois faire un Coup (≥10£)'}</span> : <span className="text-stone-200">Tour de {name(state.currentTurn)}</span>)}
                    {state.phase === 'block' && p && <span className="text-stone-100">{name(p.actor)} tente <b>{p.type}</b>{p.claim ? ` (${CHAR[p.claim].label})` : ''}{p.target != null ? ` → ${name(p.target)}` : ''}</span>}
                    {state.phase === 'challengeBlock' && p && p.blocker != null && <span className="text-stone-100">{name(p.blocker)} bloque avec <b>{CHAR[p.blockClaim!].label}</b></span>}
                    {state.phase === 'lose' && <span className="text-rose-300">{state.chooser === myIndex ? 'Tu perds une influence — choisis une carte' : `${name(state.chooser ?? 0)} perd une influence…`}</span>}
                    {state.phase === 'exchange' && <span className="text-emerald-300">{state.chooser === myIndex ? 'Choisis les cartes à garder' : `${name(state.chooser ?? 0)} échange…`}</span>}
                </span>
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
