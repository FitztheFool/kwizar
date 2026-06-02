// src/components/Messages/MessagesPageView.tsx — full-page DM view (list + thread).
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChatBubbleLeftRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import UserAvatar from '@/components/UserAvatar';
import { useMessages } from '@/context/MessagesContext';
import ConversationList from './ConversationList';
import DmThread from './DmThread';

export default function MessagesPageView({ initialUserId }: { initialUserId?: string }) {
    const router = useRouter();
    const { conversations, threads } = useMessages();
    const [selected, setSelected] = useState<string | null>(initialUserId ?? null);

    useEffect(() => {
        if (initialUserId) setSelected(initialUserId);
    }, [initialUserId]);

    const select = (id: string) => {
        setSelected(id);
        router.replace(`/messages/${id}`);
    };

    const partner = selected
        ? threads[selected]?.partner ?? conversations.find(c => c.user.id === selected)?.user ?? null
        : null;
    const partnerName = partner?.username ?? 'Conversation';

    return (
        <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
            <h1 className="hidden sm:flex text-2xl font-black text-gray-900 dark:text-white mb-4 items-center gap-2">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                Messages
            </h1>

            <div className="flex h-[calc(100vh-12rem)] min-h-[420px] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
                {/* Conversation list — full width on mobile when nothing selected */}
                <div
                    className={
                        'flex-col border-r border-gray-200 dark:border-gray-800 overflow-y-auto w-full sm:w-72 sm:shrink-0 ' +
                        (selected ? 'hidden sm:flex' : 'flex')
                    }
                >
                    <ConversationList onSelect={select} activeUserId={selected} />
                </div>

                {/* Thread */}
                <div className={'flex-col flex-1 min-w-0 ' + (selected ? 'flex' : 'hidden sm:flex')}>
                    {selected ? (
                        <>
                            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-200 dark:border-gray-800">
                                <button
                                    onClick={() => {
                                        setSelected(null);
                                        router.replace('/messages');
                                    }}
                                    aria-label="Retour"
                                    className="sm:hidden p-1 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <ChevronLeftIcon className="w-5 h-5" />
                                </button>
                                {partner && <UserAvatar name={partnerName} image={partner.image} shape="round" size="sm" />}
                                <span className="font-semibold text-gray-900 dark:text-white truncate">{partnerName}</span>
                            </div>
                            <DmThread userId={selected} className="flex-1 min-h-0" />
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                            Sélectionne une conversation
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
