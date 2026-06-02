// src/lib/friends.ts
// Shared server-side helpers for the friends/social graph.
// Reused by the friends API routes today, and by the activity feed / invites /
// DM features later (filter Attempt by getFriendIds, etc.).
import prisma from '@/lib/prisma';

/** A user is considered "online" if seen within this window. */
export const ONLINE_WINDOW_MS = 3 * 60_000;

export function isOnline(lastSeen: Date | null | undefined): boolean {
    if (!lastSeen) return false;
    return Date.now() - new Date(lastSeen).getTime() < ONLINE_WINDOW_MS;
}

export type Relationship = 'none' | 'pending_out' | 'pending_in' | 'friends';

/** Ids of every accepted friend of `userId` (links are stored directed). */
export async function getFriendIds(userId: string): Promise<string[]> {
    const rows = await prisma.friendship.findMany({
        where: {
            status: 'ACCEPTED',
            OR: [{ requesterId: userId }, { addresseeId: userId }],
        },
        select: { requesterId: true, addresseeId: true },
    });
    return rows.map(r => (r.requesterId === userId ? r.addresseeId : r.requesterId));
}

/**
 * Relationship between `meId` and `otherId`, from `meId`'s point of view.
 * Looks at the single row that may exist in either direction.
 */
export async function getRelationship(
    meId: string,
    otherId: string,
): Promise<{ relationship: Relationship; friendshipId: string | null }> {
    if (meId === otherId) return { relationship: 'none', friendshipId: null };

    const f = await prisma.friendship.findFirst({
        where: {
            OR: [
                { requesterId: meId, addresseeId: otherId },
                { requesterId: otherId, addresseeId: meId },
            ],
        },
        select: { id: true, status: true, requesterId: true },
    });

    if (!f) return { relationship: 'none', friendshipId: null };
    if (f.status === 'ACCEPTED') return { relationship: 'friends', friendshipId: f.id };
    // PENDING: depends on who sent it.
    return {
        relationship: f.requesterId === meId ? 'pending_out' : 'pending_in',
        friendshipId: f.id,
    };
}
