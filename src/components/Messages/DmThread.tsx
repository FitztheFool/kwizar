// src/components/Messages/DmThread.tsx — one conversation: message list + composer.
// Shared by the floating dock and the /messages page. Reads state from MessagesContext.
'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { useMessages } from '@/context/MessagesContext';
import { formatMessageTime } from '@/lib/time';

export default function DmThread({ userId, className = '' }: { userId: string; className?: string }) {
    const { data: session } = useSession();
    const me = session?.user?.id;
    const { threads, loadThread, sendMessage } = useMessages();
    const [draft, setDraft] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    const thread = threads[userId];
    const messages = thread?.messages ?? [];

    useEffect(() => {
        loadThread(userId);
    }, [userId, loadThread]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ block: 'end' });
    }, [messages.length]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const text = draft.trim();
        if (!text) return;
        setDraft('');
        sendMessage(userId, text);
    };

    return (
        <div className={'flex flex-col min-h-0 ' + className}>
            <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-1.5">
                {thread?.loading && messages.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 py-6">Chargement…</p>
                ) : messages.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 py-6">
                        Aucun message. Dis bonjour 👋
                    </p>
                ) : (
                    messages.map(m => {
                        const mine = m.senderId === me;
                        return (
                            <div key={m.id} className={'flex ' + (mine ? 'justify-end' : 'justify-start')}>
                                <div
                                    className={
                                        'max-w-[78%] px-3 py-1.5 rounded-2xl text-sm break-words ' +
                                        (mine
                                            ? 'bg-primary-600 text-white rounded-br-sm ' + (m.pending ? 'opacity-60 ' : '') + (m.failed ? 'bg-red-500 ' : '')
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm')
                                    }
                                    title={m.failed ? 'Échec de l’envoi' : new Date(m.createdAt).toLocaleString('fr-FR')}
                                >
                                    {m.body}
                                    <div className={'text-[10px] mt-0.5 text-right ' + (mine ? 'text-white/60' : 'text-gray-400 dark:text-gray-500')}>
                                        {m.pending ? 'Envoi…' : m.failed ? 'Échec' : formatMessageTime(m.createdAt)}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            <form onSubmit={submit} className="flex items-center gap-2 p-2 border-t border-gray-200 dark:border-gray-800">
                <input
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    placeholder="Écris un message…"
                    maxLength={2000}
                    autoComplete="off"
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary-500"
                />
                <button
                    type="submit"
                    disabled={!draft.trim()}
                    aria-label="Envoyer"
                    className="shrink-0 p-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white transition-colors disabled:opacity-40"
                >
                    <PaperAirplaneIcon className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
}
