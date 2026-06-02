// src/lib/lobbyInvites.ts
// Server-side helpers for persistent lobby invites. Persistence lives in the Next
// app (it owns the DB + friends graph); realtime delivery reuses the lobby-server
// /internal/emit push (see pushToUser), exactly like direct messages.
import prisma from '@/lib/prisma';

export type LobbyInvitePayload = {
    id: string;
    lobbyId: string;
    gameType: string;
    fromUserId: string;
    fromUsername: string | null;
    createdAt: string;
};

// Invites older than this are no longer surfaced (the lobby is likely gone).
export const INVITE_TTL_MS = 6 * 60 * 60 * 1000;

/** Pending (fresh) invites addressed to `userId`, newest first. */
export async function getPendingInvites(userId: string): Promise<LobbyInvitePayload[]> {
    const since = new Date(Date.now() - INVITE_TTL_MS);
    const rows = await prisma.lobbyInvite.findMany({
        where: { toUserId: userId, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            lobbyId: true,
            gameType: true,
            fromUserId: true,
            createdAt: true,
            fromUser: { select: { username: true } },
        },
    });
    return rows.map(r => ({
        id: r.id,
        lobbyId: r.lobbyId,
        gameType: r.gameType,
        fromUserId: r.fromUserId,
        fromUsername: r.fromUser.username,
        createdAt: r.createdAt.toISOString(),
    }));
}
