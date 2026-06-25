'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Pagination from '@/components/Pagination';
import LoadingSpinner from '@/components/LoadingSpinner';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

const PAGE_SIZE = 6;

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

    const resolvedTitle = title ?? (isOwn ? 'Mes Duels' : 'Duels');
    const resolvedEmpty = emptyTitle ?? (isOwn ? 'Aucun Duel créé' : 'Aucun Duel public');

    const [decks, setDecks] = useState<Deck[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const fetchDecks = useCallback(async (p = 1) => {
        if (!targetUserId) return;
        const params = new URLSearchParams({ page: String(p), pageSize: String(PAGE_SIZE), creatorId: targetUserId });
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
        fetchDecks(1).finally(() => setLoading(false));
    }, [status, fetchDecks, targetUserId]);

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
            <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{resolvedTitle}</h2>
                <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{total}</span>
            </div>

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                        {decks.map(deck => {
                            const cover = deck.imageUrl ?? deck.items.find(i => i.imageUrl)?.imageUrl ?? null;
                            return (
                                <div key={deck.id} className="group relative overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                    <Link href="/game/duel" className="block">
                                        <div className="aspect-[16/9] bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                            {cover ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={cover} alt={deck.title} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-5xl">{deck.emoji}</span>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <div className="font-bold text-gray-900 dark:text-white text-sm truncate">{deck.title}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{deck.items.length} items · {deck.isPublic ? 'Public' : 'Privé'}</div>
                                        </div>
                                    </Link>
                                    {isOwn && (
                                        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => router.push(`/game/duel/${deck.id}/edit`)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-white hover:bg-blue-600" title="Modifier">
                                                <PencilSquareIcon className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(deck.id)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-white hover:bg-red-600" title="Supprimer">
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={fetchDecks} />
                </>
            )}
        </div>
    );
}
