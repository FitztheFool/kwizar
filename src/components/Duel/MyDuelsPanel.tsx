'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Pagination from '@/components/Pagination';
import LoadingSpinner from '@/components/LoadingSpinner';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

const PAGE_SIZE = 10;

interface Deck {
    id: string;
    title: string;
    emoji: string;
    imageUrl: string | null;
    isPublic: boolean;
    isBuiltin: boolean;
    items: { name: string; imageUrl: string | null }[];
}

interface Props {
    creatorId?: string;
    title?: string;
    emptyTitle?: string;
}

export default function MyDuelsPanel({ creatorId, title, emptyTitle }: Props = {}) {
    const { data: session, status } = useSession();
    const router = useRouter();

    const targetUserId = creatorId ?? session?.user?.id;
    const isOwn = !!targetUserId && targetUserId === session?.user?.id;
    const isAdmin = session?.user?.role === 'ADMIN';
    const canManage = isOwn || isAdmin;

    const resolvedTitle = title ?? (isOwn ? 'Mes Duels' : 'Duels');
    const resolvedEmpty = emptyTitle ?? (isOwn ? 'Aucun Duel créé' : 'Aucun Duel public');

    const [decks, setDecks] = useState<Deck[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchDecks = useCallback(async (p = 1, s = '') => {
        if (!targetUserId) return;
        const params = new URLSearchParams({ page: String(p), pageSize: String(PAGE_SIZE), creatorId: targetUserId });
        if (s.trim()) params.set('search', s.trim());
        const res = await fetch(`/api/duel?${params}`);
        if (!res.ok) return;
        const data = await res.json();
        setDecks(data.decks ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 0);
        setPage(data.page ?? p);
    }, [targetUserId]);

    useEffect(() => {
        if (status === 'loading') return;
        if (!targetUserId) { setLoading(false); return; }
        const t = setTimeout(() => fetchDecks(1, search).finally(() => setLoading(false)), search ? 300 : 0);
        return () => clearTimeout(t);
    }, [status, fetchDecks, targetUserId, search]);

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer ce Duel ?')) return;
        const res = await fetch(`/api/duel/${id}`, { method: 'DELETE' });
        if (res.ok) setDecks(prev => prev.filter(d => d.id !== id));
        else alert('Erreur lors de la suppression');
    };

    if (status === 'loading' || loading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 md:p-8 flex items-center justify-center min-h-[200px]">
                <LoadingSpinner fullScreen={false} message="Chargement des Duels..." />
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{resolvedTitle}</h2>
                <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{total}</span>
            </div>

            <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un Duel ou un item…"
                className="w-full mb-6 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />

            {decks.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-gray-600 dark:text-gray-300 text-lg mb-2">{resolvedEmpty}</p>
                    {isOwn && (
                        <Link href="/game/duel/create" className="inline-block mt-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-400">
                            Créer mon premier Duel
                        </Link>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 items-stretch">
                        {decks.map(deck => {
                            const cover = deck.imageUrl ?? deck.items.find(i => i.imageUrl)?.imageUrl ?? null;
                            return (
                                <div key={deck.id} className="group relative aspect-[4/3] overflow-hidden rounded-md bg-zinc-800 ring-1 ring-black/5 dark:ring-white/5">
                                    <Link href={`/game/duel?play=${deck.id}`} className="block h-full w-full" title={deck.title}>
                                        {cover ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={cover} alt={deck.title} referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-5xl bg-gradient-to-br from-zinc-700 to-zinc-900">{deck.emoji}</div>
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 bg-black/85 px-2 py-2 text-center">
                                            <div className="text-sm font-bold text-white leading-tight truncate">{deck.title}</div>
                                            <div className="text-[10px] text-gray-400">{deck.items.length} items · {deck.isPublic ? 'Public' : 'Privé'}</div>
                                        </div>
                                    </Link>
                                    {canManage && (
                                        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => router.push(`/game/duel/${deck.id}/edit`)} className="flex h-6 w-6 items-center justify-center rounded bg-black/60 text-white hover:bg-blue-600" title="Modifier">
                                                <PencilSquareIcon className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => handleDelete(deck.id)} className="flex h-6 w-6 items-center justify-center rounded bg-black/60 text-white hover:bg-red-600" title="Supprimer">
                                                <TrashIcon className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={p => fetchDecks(p, search)} />
                </>
            )}
        </div>
    );
}
