// Helper générique de notification : persiste une notification et la pousse en temps réel
// dans la room user:<id>. Factorise le motif utilisé par achievementSync — réutilisable
// pour les amis, la fin de partie, etc.
//
// Fire-and-forget côté appelant : la notification est persistée avant le push, donc une
// panne réseau du push signifie juste que le destinataire la verra au prochain chargement
// (backlog via /api/me/summary) au lieu d'instantanément.

import prisma from '@/lib/prisma';
import { pushToUser } from '@/lib/messages';

export interface NotifyInput {
    /** Catégorie — résout l'icône côté client (achievement, friend_request, friend_accept…). */
    type: string;
    title: string;
    body?: string | null;
    /** Clé d'icône OU emoji, selon le type. */
    icon?: string | null;
    /** Destination au clic. */
    link?: string | null;
}

/**
 * Crée une notification pour `userId` et la pousse en temps réel.
 * Ne lève jamais : l'échec de notification ne doit pas casser l'action métier qui l'a
 * déclenchée (envoi de demande d'ami, etc.).
 */
export async function notifyUser(userId: string, input: NotifyInput): Promise<void> {
    try {
        const n = await prisma.notification.create({
            data: {
                userId,
                type: input.type,
                title: input.title,
                body: input.body ?? null,
                icon: input.icon ?? null,
                link: input.link ?? null,
            },
        });

        await pushToUser(userId, 'notification', {
            id: n.id,
            type: n.type,
            title: n.title,
            body: n.body,
            icon: n.icon,
            link: n.link,
            createdAt: n.createdAt,
        });
    } catch (err) {
        console.error('[notifyUser] error:', err);
    }
}
