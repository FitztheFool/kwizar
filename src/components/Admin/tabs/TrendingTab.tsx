'use client';

import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { GAME_OPTIONS } from '@/lib/gameConfig';
import { ArrowUpIcon, ArrowDownIcon, XMarkIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/outline';

const LABEL: Record<string, string> = Object.fromEntries(GAME_OPTIONS.map(o => [o.value, o.label]));

export default function TrendingTab() {
    const [selected, setSelected] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/admin/trending', { cache: 'no-store' });
                if (res.ok) setSelected((await res.json()).games ?? []);
            } finally { setLoading(false); }
        })();
    }, []);

    const available = GAME_OPTIONS.filter(o => !selected.includes(o.value));

    const add = (key: string) => { setSelected(s => [...s, key]); setSaved(false); };
    const remove = (key: string) => { setSelected(s => s.filter(k => k !== key)); setSaved(false); };
    const move = (i: number, dir: -1 | 1) => {
        setSelected(s => {
            const j = i + dir;
            if (j < 0 || j >= s.length) return s;
            const c = [...s];
            [c[i], c[j]] = [c[j], c[i]];
            return c;
        });
        setSaved(false);
    };

    const save = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/trending', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ games: selected }),
            });
            if (res.ok) { setSelected((await res.json()).games ?? selected); setSaved(true); }
            else alert((await res.json())?.error ?? 'Erreur');
        } finally { setSaving(false); }
    };

    if (loading) {
        return (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 flex items-center justify-center min-h-[200px]">
                <LoadingSpinner fullScreen={false} message="Chargement…" />
            </div>
        );
    }

    return (
        <div id="trending" className="scroll-mt-24 space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Jeux affichés dans le carrousel « En tendances » de l&apos;accueil. L&apos;ordre ci-dessous est l&apos;ordre d&apos;affichage.
            </p>

            {/* Sélection ordonnée */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">En tendances ({selected.length})</h3>
                {selected.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 py-4 text-center">Aucun jeu sélectionné.</p>
                ) : (
                    <ul className="space-y-1.5">
                        {selected.map((key, i) => (
                            <li key={key} className="flex items-center gap-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-3 py-2">
                                <span className="w-5 text-xs font-bold text-gray-400">{i + 1}</span>
                                <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{LABEL[key] ?? key}</span>
                                <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30" title="Monter"><ArrowUpIcon className="h-4 w-4" /></button>
                                <button onClick={() => move(i, 1)} disabled={i === selected.length - 1} className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30" title="Descendre"><ArrowDownIcon className="h-4 w-4" /></button>
                                <button onClick={() => remove(key)} className="p-1 text-gray-400 hover:text-red-600" title="Retirer"><XMarkIcon className="h-4 w-4" /></button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Jeux disponibles */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Ajouter un jeu</h3>
                <div className="flex flex-wrap gap-2">
                    {available.length === 0 && <span className="text-xs text-gray-400">Tous les jeux sont sélectionnés.</span>}
                    {available.map(o => (
                        <button
                            key={o.value}
                            onClick={() => add(o.value)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <PlusIcon className="h-3.5 w-3.5" /> {o.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button onClick={save} disabled={saving} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50">
                    {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                {saved && <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400"><CheckIcon className="h-4 w-4" /> Enregistré</span>}
            </div>
        </div>
    );
}
