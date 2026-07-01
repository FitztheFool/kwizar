'use client';

import { useCallback, useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { CheckCircleIcon, NoSymbolIcon, UsersIcon, ChatBubbleLeftRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { setFeatureFlagCache, type FeatureFlags } from '@/hooks/useFeatureFlags';

type Feature = {
    key: keyof FeatureFlags;
    label: string;
    description: string;
    category: string;
    Icon: React.FC<{ className?: string }>;
};

const FEATURES: Feature[] = [
    {
        key: 'friends',
        label: "Demandes d'amis",
        description: "Ajout d'amis et liste d'amis. Désactivé : la page Amis disparaît et les demandes sont bloquées.",
        category: 'Social',
        Icon: UsersIcon,
    },
    {
        key: 'messages',
        label: 'Messagerie',
        description: 'Messages privés entre joueurs. Désactivé : la messagerie disparaît et les envois sont bloqués.',
        category: 'Social',
        Icon: ChatBubbleLeftRightIcon,
    },
    {
        key: 'sidebarSearch',
        label: 'Barre de recherche',
        description: 'Barre de recherche dans la sidebar. Désactivé : elle est masquée pour tous les utilisateurs.',
        category: 'Interface',
        Icon: MagnifyingGlassIcon,
    },
];

// Catégories dans l'ordre de première apparition dans FEATURES.
const CATEGORIES = FEATURES.reduce<string[]>((acc, f) => {
    if (!acc.includes(f.category)) acc.push(f.category);
    return acc;
}, []);

export default function FeaturesTab() {
    const [flags, setFlags] = useState<FeatureFlags | null>(null);
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/admin/settings', { cache: 'no-store' });
                if (res.ok) setFlags(await res.json());
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const toggle = useCallback(async (key: keyof FeatureFlags) => {
        if (!flags) return;
        const next = !flags[key];
        setSavingKey(key);
        setFlags(prev => prev ? { ...prev, [key]: next } : prev);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, enabled: next }),
            });
            if (!res.ok) throw new Error((await res.json())?.error ?? 'Erreur');
            // Propage le changement aux composants live (sidebar, dock…).
            setFeatureFlagCache(key, next);
        } catch (err) {
            setFlags(prev => prev ? { ...prev, [key]: !next } : prev);
            alert(err instanceof Error ? err.message : 'Erreur réseau');
        } finally {
            setSavingKey(null);
        }
    }, [flags]);

    if (loading || !flags) {
        return (
            <div className="flex items-center justify-center py-20">
                <LoadingSpinner fullScreen={false} message="Chargement des fonctionnalités..." />
            </div>
        );
    }

    return (
        <div id="admin-features" className="scroll-mt-24 space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Activez ou désactivez des fonctionnalités de la plateforme pour tous les utilisateurs.
            </p>

            {CATEGORIES.map(category => (
                <section key={category} className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 px-1">
                        {category}
                    </h3>
                    <ul className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-50 dark:divide-gray-700/50">
                        {FEATURES.filter(f => f.category === category).map(({ key, label, description, Icon }) => {
                            const enabled = flags[key];
                            return (
                                <li key={key} className="flex items-start justify-between px-4 py-4 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors gap-4">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${enabled ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'}`} />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-semibold ${enabled ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>{label}</span>
                                                {enabled
                                                    ? <CheckCircleIcon className="w-4 h-4 text-green-500 shrink-0" />
                                                    : <NoSymbolIcon className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={enabled}
                                        disabled={savingKey === key}
                                        onChange={() => toggle(key)}
                                        title={enabled ? 'Désactiver' : 'Activer'}
                                        className="h-5 w-5 shrink-0 mt-0.5 rounded border-gray-300 dark:border-gray-600 text-green-500 focus:ring-green-500 disabled:opacity-50 cursor-pointer accent-green-500"
                                    />
                                </li>
                            );
                        })}
                    </ul>
                </section>
            ))}
        </div>
    );
}
