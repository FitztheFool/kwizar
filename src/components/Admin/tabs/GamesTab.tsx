'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { CheckCircleIcon, NoSymbolIcon, MagnifyingGlassIcon, BarsArrowUpIcon, BarsArrowDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface AdminGame {
    key: string;
    gameType: string;
    label: string;
    mode: 'solo' | 'both' | 'multi';
    enabled: boolean;
}

const MODE_LABEL: Record<AdminGame['mode'], string> = {
    solo: 'Solo',
    both: 'Mixte',
    multi: 'Multijoueur',
};

const MODE_ORDER: AdminGame['mode'][] = ['both', 'multi', 'solo'];

export default function GamesTab() {
    const [games, setGames] = useState<AdminGame[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [savingMode, setSavingMode] = useState<AdminGame['mode'] | null>(null);

    // Tri : 1) par type (ordre des modes), 2) par nom (asc/desc) + recherche autocomplétée.
    const [typeAsc, setTypeAsc] = useState(true);
    const [nameAsc, setNameAsc] = useState(true);
    const [search, setSearch] = useState('');

    const fetchGames = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/games', { cache: 'no-store' });
            if (res.ok) setGames((await res.json()).games ?? []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchGames(); }, [fetchGames]);

    const patchGame = useCallback(async (key: string, enabled: boolean) => {
        const res = await fetch('/api/admin/games', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, enabled }),
        });
        if (!res.ok) throw new Error((await res.json())?.error ?? 'Erreur lors de la mise à jour');
    }, []);

    const toggle = useCallback(async (game: AdminGame) => {
        const next = !game.enabled;
        setSavingKey(game.key);
        // Optimiste : on bascule tout de suite, on annule si l'API échoue.
        setGames(prev => prev.map(g => g.key === game.key ? { ...g, enabled: next } : g));
        try {
            await patchGame(game.key, next);
        } catch (err) {
            setGames(prev => prev.map(g => g.key === game.key ? { ...g, enabled: game.enabled } : g));
            alert(err instanceof Error ? err.message : 'Erreur réseau');
        } finally {
            setSavingKey(null);
        }
    }, [patchGame]);

    const toggleGroup = useCallback(async (mode: AdminGame['mode'], next: boolean) => {
        const targets = games.filter(g => g.mode === mode && g.enabled !== next);
        if (targets.length === 0) return;

        setSavingMode(mode);
        const previous = games;
        // Optimiste : on bascule tout le groupe d'un coup.
        setGames(prev => prev.map(g => g.mode === mode ? { ...g, enabled: next } : g));
        try {
            const results = await Promise.allSettled(targets.map(g => patchGame(g.key, next)));
            const failed = results.filter(r => r.status === 'rejected');
            if (failed.length > 0) {
                // On ne réverte que les jeux dont la requête a échoué.
                setGames(prev => prev.map(g => {
                    const idx = targets.findIndex(t => t.key === g.key);
                    if (idx === -1) return g;
                    return results[idx].status === 'rejected'
                        ? { ...g, enabled: previous.find(p => p.key === g.key)!.enabled }
                        : g;
                }));
                alert(`${failed.length} jeu${failed.length > 1 ? 'x' : ''} n'${failed.length > 1 ? 'ont' : 'a'} pas pu être mis à jour`);
            }
        } finally {
            setSavingMode(null);
        }
    }, [games, patchGame]);

    const grouped = useMemo(() => {
        const q = search.trim().toLowerCase();
        const order = typeAsc ? MODE_ORDER : [...MODE_ORDER].reverse();
        return order.map(mode => ({
            mode,
            games: games
                .filter(g => g.mode === mode && (!q || g.label.toLowerCase().includes(q)))
                .sort((a, b) => nameAsc
                    ? a.label.localeCompare(b.label, 'fr')
                    : b.label.localeCompare(a.label, 'fr')),
        })).filter(g => g.games.length > 0);
    }, [games, typeAsc, nameAsc, search]);

    const enabledCount = games.filter(g => g.enabled).length;
    // Suggestions d'autocomplétion : tous les noms de jeux, triés.
    const nameSuggestions = useMemo(
        () => [...games].map(g => g.label).sort((a, b) => a.localeCompare(b, 'fr')),
        [games],
    );
    const matchCount = grouped.reduce((n, g) => n + g.games.length, 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <LoadingSpinner fullScreen={false} message="Chargement des jeux..." />
            </div>
        );
    }

    return (
        <div id="admin-games" className="scroll-mt-24 space-y-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-gray-700 dark:text-gray-200">{enabledCount}</span> jeu{enabledCount > 1 ? 'x' : ''} activé{enabledCount > 1 ? 's' : ''} sur {games.length}.
                Un jeu désactivé disparaît de l&apos;accueil et du lobby, et ne peut plus être lancé.
            </p>

            {/* Barre de tri + recherche avec autocomplétion */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                    <MagnifyingGlassIcon className="absolute inset-y-0 left-3 my-auto w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        list="admin-games-names"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher un jeu…"
                        className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                    <datalist id="admin-games-names">
                        {nameSuggestions.map(name => <option key={name} value={name} />)}
                    </datalist>
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="absolute inset-y-0 right-2 my-auto flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            title="Effacer"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => setTypeAsc(v => !v)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    title="Inverser l'ordre des types"
                >
                    {typeAsc ? <BarsArrowDownIcon className="w-4 h-4" /> : <BarsArrowUpIcon className="w-4 h-4" />}
                    Type {typeAsc ? '(Mixte → Solo)' : '(Solo → Mixte)'}
                </button>

                <button
                    type="button"
                    onClick={() => setNameAsc(v => !v)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    title="Inverser l'ordre des noms"
                >
                    {nameAsc ? <BarsArrowDownIcon className="w-4 h-4" /> : <BarsArrowUpIcon className="w-4 h-4" />}
                    Nom {nameAsc ? '(A → Z)' : '(Z → A)'}
                </button>
            </div>

            {search && matchCount === 0 && (
                <p className="px-4 py-10 text-sm text-center text-gray-400 dark:text-gray-500">
                    Aucun jeu ne correspond à « {search} ».
                </p>
            )}

            {grouped.map(({ mode, games: list }) => {
                // L'en-tête « Tout activer » porte sur tout le groupe de ce type,
                // pas seulement sur les jeux visibles après recherche.
                const modeGames = games.filter(g => g.mode === mode);
                const allEnabled = modeGames.every(g => g.enabled);
                const someEnabled = modeGames.some(g => g.enabled);
                const groupSaving = savingMode === mode;

                return (
                    <div key={mode}>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                {MODE_LABEL[mode]} <span className="text-gray-300 dark:text-gray-600">· {list.length}</span>
                            </h3>
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={allEnabled}
                                    ref={el => { if (el) el.indeterminate = !allEnabled && someEnabled; }}
                                    disabled={groupSaving}
                                    onChange={() => toggleGroup(mode, !allEnabled)}
                                    className="h-4 w-4 shrink-0 rounded border-gray-300 dark:border-gray-600 text-green-500 focus:ring-green-500 disabled:opacity-50 cursor-pointer accent-green-500"
                                />
                                {groupSaving ? 'Mise à jour...' : 'Tout activer'}
                            </label>
                        </div>
                        <ul className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-50 dark:divide-gray-700/50">
                            {list.map(game => (
                                <li key={game.key} className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        {game.enabled
                                            ? <CheckCircleIcon className="w-5 h-5 text-green-500 shrink-0" />
                                            : <NoSymbolIcon className="w-5 h-5 text-gray-300 dark:text-gray-600 shrink-0" />}
                                        <span className={`text-sm font-medium truncate ${game.enabled ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500 line-through'}`}>
                                            {game.label}
                                        </span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={game.enabled}
                                        disabled={savingKey === game.key || groupSaving}
                                        onChange={() => toggle(game)}
                                        title={game.enabled ? 'Désactiver' : 'Activer'}
                                        className="h-5 w-5 shrink-0 rounded border-gray-300 dark:border-gray-600 text-green-500 focus:ring-green-500 disabled:opacity-50 cursor-pointer accent-green-500"
                                    />
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}
        </div>
    );
}
