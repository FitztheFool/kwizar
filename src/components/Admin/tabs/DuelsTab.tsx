'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import type { AdminDuel } from '../types';

interface Props {
    duels: AdminDuel[];
    page: number;
    totalPages: number;
    onFetch: (page: number, search: string) => void;
    onDelete: (deckId: string, title: string) => void;
}

export default function DuelsTab({ duels, page, totalPages, onFetch, onDelete }: Props) {
    const [search, setSearch] = useState('');
    const searchRef = useRef('');
    const isFirstRender = useRef(true);

    useEffect(() => {
        searchRef.current = search;
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        const t = setTimeout(() => onFetch(1, search), 400);
        return () => clearTimeout(t);
    }, [search]);

    return (
        <div id="duels" className="scroll-mt-24 space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3 flex gap-2">
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher par titre…"
                    className="flex-1 text-xs border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                    <table className="w-full text-sm">
                        <thead className="bg-white dark:bg-gray-900">
                            <tr className="text-left">
                                {['', 'Titre', 'Créateur', 'Items', 'Type', 'Visibilité', 'Actions'].map((h, i) => (
                                    <th key={i} className="px-3 py-2 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {duels.length === 0 && (
                                <tr><td colSpan={7} className="px-3 py-6 text-xs text-center text-gray-400 dark:text-gray-500">Aucun Duel trouvé.</td></tr>
                            )}
                            {duels.map(deck => (
                                <tr key={deck.id} className="hover:bg-white dark:hover:bg-gray-900 transition-colors">
                                    <td className="px-3 py-2">
                                        <div className="h-9 w-12 overflow-hidden rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                            {deck.imageUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={deck.imageUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-base">{deck.emoji}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 font-medium max-w-[200px]">
                                        <span className="text-xs truncate block">{deck.emoji} {deck.title}</span>
                                    </td>
                                    <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">{deck.creator.username}</td>
                                    <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300 font-semibold">{deck._count.items}</td>
                                    <td className="px-3 py-2">
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${deck.isBuiltin ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                                            {deck.isBuiltin ? 'Intégré' : 'Utilisateur'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2">
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${deck.isPublic ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                                            {deck.isPublic ? 'Public' : 'Privé'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex gap-1.5">
                                            <Link href={`/game/duel/${deck.id}/edit`} className="text-[10px] font-semibold text-blue-500 hover:text-blue-700 px-2 py-0.5 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">Modifier</Link>
                                            <button onClick={() => onDelete(deck.id, deck.title)} className="text-[10px] font-semibold text-red-500 hover:text-red-700 px-2 py-0.5 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Supprimer</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={p => onFetch(p, searchRef.current)} />
            </div>
        </div>
    );
}
