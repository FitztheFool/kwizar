// src/components/Messages/ConversationList.tsx — list of DM conversations.
'use client';

import UserAvatar from '@/components/UserAvatar';
import { useMessages } from '@/context/MessagesContext';
import { formatRelativeShort } from '@/lib/time';

export default function ConversationList({
    onSelect,
    activeUserId,
}: {
    onSelect: (userId: string) => void;
    activeUserId?: string | null;
}) {
    const { conversations } = useMessages();

    if (conversations.length === 0) {
        return (
            <p className="text-center text-sm text-gray-400 px-4 py-10">
                Aucune conversation. Écris à un ami depuis sa page de profil ou l&apos;onglet Amis.
            </p>
        );
    }

    return (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {conversations.map(c => {
                const name = c.user.username ?? 'Joueur';
                const active = activeUserId === c.user.id;
                return (
                    <button
                        key={c.user.id}
                        onClick={() => onSelect(c.user.id)}
                        className={
                            'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ' +
                            (active ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/60')
                        }
                    >
                        <UserAvatar name={name} image={c.user.image} online={c.user.online} shape="round" size="md" />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 dark:text-white truncate">{name}</span>
                                <span className="ml-auto shrink-0 text-[10px] text-gray-400">
                                    {formatRelativeShort(c.lastMessage.createdAt)}
                                </span>
                            </div>
                            <p className={'text-xs truncate ' + (c.unreadCount > 0 ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-400')}>
                                {c.lastMessage.fromMe ? 'Toi : ' : ''}
                                {c.lastMessage.body}
                            </p>
                        </div>
                        {c.unreadCount > 0 && (
                            <span className="shrink-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary-600 text-white text-[10px] font-bold">
                                {c.unreadCount > 9 ? '9+' : c.unreadCount}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
