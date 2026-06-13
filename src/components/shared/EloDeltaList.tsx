// src/components/shared/EloDeltaList.tsx
'use client';
import { useSession } from 'next-auth/react';

interface EloEntry {
    userId: string;
    username?: string | null;
    after: number;
    delta: number;
}

/** Liste « Variations ELO » de fin de partie : un delta par joueur (vert gain / rouge perte). */
export default function EloDeltaList({ elo }: { elo?: EloEntry[] | null }) {
    const { data: session } = useSession();
    if (!elo || elo.length === 0) return null;

    const me = session?.user?.id;
    const sorted = [...elo].sort((a, b) => b.after - a.after);

    return (
        <div className="mt-3 text-left">
            <p className="mb-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Variations ELO
            </p>
            <div className="space-y-1">
                {sorted.map(e => {
                    const up = e.delta >= 0;
                    const mine = e.userId === me;
                    return (
                        <div
                            key={e.userId}
                            className={`flex items-center justify-between gap-3 rounded-lg px-3 py-1.5 ${mine ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-white/[0.03]'}`}
                        >
                            <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                                {e.username ?? 'Joueur'}{mine && <span className="text-gray-400 font-normal"> (moi)</span>}
                            </span>
                            <span className="flex items-baseline gap-2 shrink-0">
                                <span className={`text-sm font-bold ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {up ? '+' : ''}{e.delta}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">{e.after}</span>
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
