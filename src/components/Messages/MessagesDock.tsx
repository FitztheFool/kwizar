// src/components/Messages/MessagesDock.tsx
// Messenger-style floating dock, rendered globally. Opens from the header icon or a
// friend's "Message" button. Hidden inside lobbies (the lobby chat owns that corner)
// and on the full /messages page.
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ChevronLeftIcon, XMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import UserAvatar from '@/components/UserAvatar';
import { useMessages } from '@/context/MessagesContext';
import { useChat } from '@/context/ChatContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import ConversationList from './ConversationList';
import DmThread from './DmThread';

export default function MessagesDock() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const { lobbyId } = useChat();
    const { dockOpen, activeUserId, openThread, closeThread, closeDock, conversations, threads } = useMessages();
    const { messages: messagesEnabled } = useFeatureFlags();

    const isGuest = (session?.user?.isAnonymous ?? false) || session?.user?.role === 'GUEST';
    if (!session?.user?.id || isGuest || !messagesEnabled) return null;
    if (!dockOpen) return null;
    if (pathname?.startsWith('/messages')) return null;
    // In a lobby the unified FloatingChat panel hosts DMs (its "Messages" tab),
    // so the standalone dock stays out of the way.
    if (lobbyId) return null;

    const sideClass = 'right-4';

    const partner = activeUserId
        ? threads[activeUserId]?.partner ?? conversations.find(c => c.user.id === activeUserId)?.user ?? null
        : null;
    const partnerName = partner?.username ?? 'Conversation';

    return (
        <div className={`glass-strong fixed ${sideClass} bottom-4 z-50 w-80 max-w-[calc(100vw-2rem)] h-[460px] max-h-[calc(100vh-2rem)] flex flex-col rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4`}>
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-primary-600 dark:bg-gray-800 text-white">
                {activeUserId ? (
                    <>
                        <button onClick={closeThread} aria-label="Retour" className="p-1 -ml-1 rounded-lg hover:bg-white/15">
                            <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                        {partner ? (
                            <Link href={`/user/${partner.username}`} onClick={closeDock} className="flex items-center gap-2 min-w-0 hover:opacity-90 transition-opacity" title={`Voir le profil de ${partnerName}`}>
                                <UserAvatar name={partnerName} image={partner.image} shape="round" size="sm" />
                                <span className="font-semibold truncate hover:underline">{partnerName}</span>
                            </Link>
                        ) : (
                            <span className="font-semibold truncate">{partnerName}</span>
                        )}
                    </>
                ) : (
                    <>
                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                        <span className="font-semibold">Messages</span>
                    </>
                )}
                <button onClick={closeDock} aria-label="Fermer" className="ml-auto p-1 rounded-lg hover:bg-white/15">
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Body */}
            {activeUserId ? (
                <DmThread userId={activeUserId} className="flex-1 min-h-0" />
            ) : (
                <div className="flex-1 min-h-0 overflow-y-auto">
                    <ConversationList onSelect={openThread} activeUserId={activeUserId} />
                </div>
            )}
        </div>
    );
}
