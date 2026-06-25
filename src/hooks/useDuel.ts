'use client';

import { useCallback, useState } from 'react';
import { DuelCategory, DuelItem } from '@/lib/duel/types';

type Phase = 'category' | 'duel' | 'podium';

function shuffle<T>(a: T[]): T[] {
    const c = [...a];
    for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[c[i], c[j]] = [c[j], c[i]]; }
    return c;
}
const pow2 = (n: number) => { let p = 1; while (p * 2 <= n) p *= 2; return p; };

interface Podium { winner: DuelItem; finalist: DuelItem | null; semi: DuelItem[]; }

export function useDuel() {
    const [phase, setPhase] = useState<Phase>('category');
    const [category, setCategory] = useState<DuelCategory | null>(null);

    const [queue, setQueue] = useState<[DuelItem, DuelItem][]>([]);  // matchs du tour courant
    const [winners, setWinners] = useState<DuelItem[]>([]);
    const [matchIndex, setMatchIndex] = useState(0);
    const [roundSize, setRoundSize] = useState(0);
    const [finalist, setFinalist] = useState<DuelItem | null>(null);
    const [semi, setSemi] = useState<DuelItem[]>([]);
    const [podium, setPodium] = useState<Podium | null>(null);
    const [totalRounds, setTotalRounds] = useState(0);
    const [roundNo, setRoundNo] = useState(0);

    const pair = (items: DuelItem[]): [DuelItem, DuelItem][] => {
        const out: [DuelItem, DuelItem][] = [];
        for (let i = 0; i < items.length; i += 2) out.push([items[i], items[i + 1]]);
        return out;
    };

    const start = useCallback((cat: DuelCategory) => {
        const size = Math.min(8, pow2(cat.items.length));   // tournoi à 8 max (ou 4)
        const pool = shuffle(cat.items).slice(0, size);
        setCategory(cat);
        setQueue(pair(pool));
        setWinners([]); setMatchIndex(0); setRoundSize(size);
        setFinalist(null); setSemi([]); setPodium(null);
        setTotalRounds(Math.log2(size)); setRoundNo(1);
        setPhase('duel');
    }, []);

    const choose = useCallback((winner: DuelItem) => {
        const match = queue[matchIndex];
        if (!match) return;
        const loser = match[0] === winner ? match[1] : match[0];
        if (roundSize === 4) setSemi(s => [...s, loser]);   // demi-finales → 3e/4e
        if (roundSize === 2) setFinalist(loser);            // finale → 2e

        const newWinners = [...winners, winner];
        if (matchIndex + 1 < queue.length) {
            setWinners(newWinners); setMatchIndex(matchIndex + 1);
            return;
        }
        // tour terminé
        if (newWinners.length === 1) {
            setPodium({ winner: newWinners[0], finalist: roundSize === 2 ? (queue[0][0] === newWinners[0] ? queue[0][1] : queue[0][0]) : finalist, semi });
            setPhase('podium');
            return;
        }
        setQueue(pair(newWinners)); setWinners([]); setMatchIndex(0);
        setRoundSize(newWinners.length); setRoundNo(r => r + 1);
    }, [queue, matchIndex, winners, roundSize, finalist, semi]);

    const reset = useCallback(() => { setPhase('category'); setCategory(null); setPodium(null); }, []);

    return {
        phase, category, start, choose, reset, podium,
        currentMatch: queue[matchIndex] ?? null,
        roundNo, totalRounds,
        roundLabel: roundSize === 2 ? 'Finale' : roundSize === 4 ? 'Demi-finale' : roundSize === 8 ? 'Quart de finale' : 'Tour',
    };
}
