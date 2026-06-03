// src/lib/messages.ts
// Server-side helpers for private messages (DM). Persistence + friends-only logic
// lives here in the Next app (it owns the DB + the friends graph); realtime delivery
// is pushed out through the lobby-server's /internal/emit endpoint.
import prisma from '@/lib/prisma';
import { isOnline } from '@/lib/friends';

/** Shape sent to clients (and over the socket) — dates as ISO strings. */
export type DMMessage = {
    id: string;
    senderId: string;
    recipientId: string;
    body: string;
    createdAt: string;
    readAt: string | null;
};

export const MAX_BODY = 2000;

export function serializeMessage(m: {
    id: string;
    senderId: string;
    recipientId: string;
    body: string;
    createdAt: Date;
    readAt: Date | null;
}): DMMessage {
    return {
        id: m.id,
        senderId: m.senderId,
        recipientId: m.recipientId,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
        readAt: m.readAt ? m.readAt.toISOString() : null,
    };
}

/**
 * Push a realtime event to a user's personal room via the lobby-server.
 * Fire-and-forget: the message is already persisted, so a transient failure
 * just means the recipient sees it on the next fetch/poll instead of instantly.
 */
export async function pushToUser(userId: string, event: 'dm:message' | 'dm:read' | 'lobby:invited', payload: unknown): Promise<void> {
    const base = process.env.NEXT_PUBLIC_LOBBY_SERVER_URL;
    const key = process.env.INTERNAL_API_KEY;
    if (!base || !key) return;
    try {
        await fetch(`${base}/internal/emit`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ room: `user:${userId}`, event, payload }),
            signal: AbortSignal.timeout(3_000),
        });
    } catch {
        /* delivery is best-effort */
    }
}

export type Conversation = {
    user: { id: string; username: string | null; image: string | null; online: boolean };
    lastMessage: { body: string; createdAt: string; fromMe: boolean };
    unreadCount: number;
};

/** Latest message id per conversation partner of `meId` (one row per partner). */
type LastRow = { partner: string; id: string; body: string; createdAt: Date; senderId: string };

/**
 * One conversation per partner with whom `meId` exchanged at least one message,
 * each carrying the last message + how many incoming messages are still unread.
 */
export async function getConversations(meId: string): Promise<{ conversations: Conversation[]; totalUnread: number }> {
    const lastRows = await prisma.$queryRaw<LastRow[]>`
        SELECT DISTINCT ON (partner)
            partner, id, body, "createdAt", "senderId"
        FROM (
            SELECT *,
                CASE WHEN "senderId" = ${meId} THEN "recipientId" ELSE "senderId" END AS partner
            FROM direct_messages
            WHERE "senderId" = ${meId} OR "recipientId" = ${meId}
        ) t
        ORDER BY partner, "createdAt" DESC
    `;
    if (lastRows.length === 0) return { conversations: [], totalUnread: 0 };

    const partnerIds = lastRows.map(r => r.partner);

    const [users, unreadGroups] = await Promise.all([
        prisma.user.findMany({
            where: { id: { in: partnerIds } },
            select: { id: true, username: true, image: true, lastSeen: true },
        }),
        prisma.directMessage.groupBy({
            by: ['senderId'],
            where: { recipientId: meId, readAt: null },
            _count: { _all: true },
        }),
    ]);

    const userById = new Map(users.map(u => [u.id, u]));
    const unreadBySender = new Map(unreadGroups.map(g => [g.senderId, g._count._all]));

    const conversations: Conversation[] = lastRows
        .map(r => {
            const u = userById.get(r.partner);
            if (!u) return null; // partner deleted
            return {
                user: { id: u.id, username: u.username, image: u.image, online: isOnline(u.lastSeen) },
                lastMessage: {
                    body: r.body,
                    createdAt: r.createdAt.toISOString(),
                    fromMe: r.senderId === meId,
                },
                unreadCount: unreadBySender.get(r.partner) ?? 0,
            };
        })
        .filter((c): c is Conversation => c !== null)
        .sort((a, b) => b.lastMessage.createdAt.localeCompare(a.lastMessage.createdAt));

    const totalUnread = conversations.reduce((n, c) => n + c.unreadCount, 0);
    return { conversations, totalUnread };
}
