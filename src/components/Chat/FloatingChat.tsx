// src/components/Chat/FloatingChat.tsx
// In a lobby/game, this is the single floating chat panel: the lobby (and team)
// chat plus a "Messages" tab for private DMs, so the two chats never collide.
'use client';

import { useChat } from '@/context/ChatContext';
import { useSession } from 'next-auth/react';
import Chat from '@/components/Chat/Chat';
import { useMessages } from '@/context/MessagesContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import DmPanel from '@/components/Messages/DmPanel';

export default function FloatingChat() {
    const { lobbyId, messages, teamMessages, myTeam, hasTeamChat, sendChat } = useChat();
    const { data: session } = useSession();
    const { dockOpen, activeUserId, totalUnread } = useMessages();
    const { messages: messagesEnabled } = useFeatureFlags();
    if (!lobbyId) return null;

    const isGuest = (session?.user?.isAnonymous ?? false) || session?.user?.role === 'GUEST';
    const showDm = !isGuest && messagesEnabled && !!session?.user?.id;

    return (
        <Chat
            messages={messages}
            teamMessages={hasTeamChat && myTeam !== undefined ? teamMessages : undefined}
            onSend={sendChat}
            teamColor={hasTeamChat && myTeam !== undefined ? myTeam : undefined}
            currentUserId={session?.user?.id}
            dmSlot={showDm ? <DmPanel /> : undefined}
            dmUnread={totalUnread}
            dmRequestOpen={dockOpen}
            dmActiveUserId={activeUserId}
        />
    );
}
