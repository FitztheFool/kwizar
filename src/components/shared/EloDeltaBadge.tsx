// src/components/shared/EloDeltaBadge.tsx
'use client';

interface Props {
    elo?: { delta: number; after: number } | null;
    className?: string;
}

/** Pastille « +12 ELO → 1024 » affichée sur l'écran de fin de partie. Vert si gain, rouge si perte. */
export default function EloDeltaBadge({ elo, className = '' }: Props) {
    if (!elo) return null;
    const up = elo.delta >= 0;
    return (
        <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ${
                up
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
            } ${className}`}
        >
            <span>{up ? '▲' : '▼'} {up ? '+' : ''}{elo.delta} ELO</span>
            <span className="opacity-70">→ {elo.after}</span>
        </div>
    );
}
