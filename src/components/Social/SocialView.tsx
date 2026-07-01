// src/components/Social/SocialView.tsx — unified social hub (master-detail, Discord-style).
// Left rail: an "Amis" button + the conversation list. Right pane: either the friends
// manager or the selected DM thread. The two old routes (/friends, /messages) and the
// header/command-palette shortcuts all render this single view.
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ChatBubbleLeftRightIcon,
    ChevronLeftIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';
import UserAvatar from '@/components/UserAvatar';
import { useMessages } from '@/context/MessagesContext';
import { useFriends } from '@/context/FriendsContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import ConversationList from '@/components/Messages/ConversationList';
import DmThread from '@/components/Messages/DmThread';
import FriendsManager from '@/components/Friends/FriendsManager';

type Panel = 'friends' | 'messages';

export default function SocialView({
    initialUserId,
    initialPanel = 'messages',
    initialTab,
}: {
    initialUserId?: string;
    initialPanel?: Panel;
    initialTab?: string;
}) {
    const router = useRouter();
    const { conversations, threads } = useMessages();
    const { pendingCount } = useFriends();
    const { messages: messagesEnabled, friends: friendsEnabled } = useFeatureFlags();

    const [panel, setPanel] = useState<Panel>(initialUserId ? 'messages' : initialPanel);
    const [selected, setSelected] = useState<string | null>(initialUserId ?? null);

    useEffect(() => {
        if (initialUserId) {
            setSelected(initialUserId);
            setPanel('messages');
        }
    }, [initialUserId]);

    // Both social features off → page inaccessible. If only one is on, fall back to it.
    useEffect(() => {
        if (!messagesEnabled && !friendsEnabled) router.replace('/');
        else if (!messagesEnabled && panel === 'messages') setPanel('friends');
        else if (!friendsEnabled && panel === 'friends') setPanel('messages');
    }, [messagesEnabled, friendsEnabled, panel, router]);

    const selectConversation = (id: string) => {
        setSelected(id);
        setPanel('messages');
        router.replace(`/messages/${id}`);
    };

    const openFriends = () => {
        setSelected(null);
        setPanel('friends');
        router.replace('/friends');
    };

    const backToList = () => {
        setSelected(null);
        setPanel('messages');
        router.replace('/messages');
    };

    const partner = selected
        ? threads[selected]?.partner ?? conversations.find(c => c.user.id === selected)?.user ?? null
        : null;
    const partnerName = partner?.username ?? 'Conversation';

    // A detail is shown whenever the friends panel is open or a conversation is selected.
    const detailOpen = panel === 'friends' || selected !== null;

    return (
        <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
            <h1 className="hidden sm:flex text-2xl font-black text-gray-900 dark:text-white mb-4 items-center gap-2">
                <UsersIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                Social
            </h1>

            <div className="flex h-[calc(100vh-9rem)] sm:h-[calc(100vh-12rem)] min-h-[440px] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
                {/* Left rail — full width on mobile when no detail is open */}
                <div
                    className={
                        'flex-col border-r border-gray-200 dark:border-gray-800 w-full sm:w-72 sm:shrink-0 ' +
                        (detailOpen ? 'hidden sm:flex' : 'flex')
                    }
                >
                    {friendsEnabled && (
                        <button
                            onClick={openFriends}
                            className={
                                'flex items-center gap-2 px-3 py-3 text-sm font-semibold border-b border-gray-200 dark:border-gray-800 transition-colors shrink-0 ' +
                                (panel === 'friends'
                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/60')
                            }
                        >
                            <UsersIcon className="w-5 h-5" />
                            Amis
                            {pendingCount > 0 && (
                                <span className="ml-auto min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary-600 text-white text-[10px] font-bold">
                                    {pendingCount > 9 ? '9+' : pendingCount}
                                </span>
                            )}
                        </button>
                    )}

                    {messagesEnabled && (
                        <div className="flex-1 min-h-0 overflow-y-auto">
                            <ConversationList onSelect={selectConversation} activeUserId={panel === 'messages' ? selected : null} />
                        </div>
                    )}
                </div>

                {/* Detail pane */}
                <div className={'flex-col flex-1 min-w-0 ' + (detailOpen ? 'flex' : 'hidden sm:flex')}>
                    {panel === 'friends' ? (
                        <>
                            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-200 dark:border-gray-800 shrink-0">
                                <button
                                    onClick={backToList}
                                    aria-label="Retour"
                                    className="sm:hidden p-1 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <ChevronLeftIcon className="w-5 h-5" />
                                </button>
                                <UsersIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                <span className="font-semibold text-gray-900 dark:text-white">Amis</span>
                            </div>
                            <FriendsManager onMessage={selectConversation} initialTab={initialTab} />
                        </>
                    ) : selected ? (
                        <>
                            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-200 dark:border-gray-800 shrink-0">
                                <button
                                    onClick={backToList}
                                    aria-label="Retour"
                                    className="sm:hidden p-1 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
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
                            <DmThread userId={selected} className="flex-1 min-h-0" />
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm gap-2">
                            <ChatBubbleLeftRightIcon className="w-5 h-5" />
                            Sélectionne une conversation
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
