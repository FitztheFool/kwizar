// src/components/Messages/DmPanel.tsx
// DM body shared by the floating dock and the in-lobby unified chat panel:
// shows the conversation list, or an open thread with a back button.
'use client';

import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import UserAvatar from '@/components/UserAvatar';
import { useMessages } from '@/context/MessagesContext';
import ConversationList from './ConversationList';
import DmThread from './DmThread';

export default function DmPanel() {
    const { activeUserId, openThread, closeThread, conversations, threads } = useMessages();

    const partner = activeUserId
        ? threads[activeUserId]?.partner ?? conversations.find(c => c.user.id === activeUserId)?.user ?? null
        : null;
    const partnerName = partner?.username ?? 'Conversation';

    if (activeUserId) {
        return (
            <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-800">
                    <button onClick={closeThread} aria-label="Retour aux conversations" className="p-1 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    {partner ? (
                        <Link href={`/user/${partner.username}`} className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity" title={`Voir le profil de ${partnerName}`}>
                            <UserAvatar name={partnerName} image={partner.image} shape="round" size="sm" />
                            <span className="font-semibold text-gray-900 dark:text-white truncate hover:underline">{partnerName}</span>
                        </Link>
                    ) : (
                        <span className="font-semibold text-gray-900 dark:text-white truncate">{partnerName}</span>
                    )}
                </div>
                <DmThread userId={activeUserId} className="flex-1 min-h-0" />
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-0 overflow-y-auto">
            <ConversationList onSelect={openThread} activeUserId={activeUserId} />
        </div>
    );
}
