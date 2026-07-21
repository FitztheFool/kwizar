// Détection + persistance des succès nouvellement débloqués.
//
// Appelé fire-and-forget après chaque création d'attempt (handler solo + webhook
// /api/attempts). Recalcule les stats, compare aux succès déjà persistés, insère les
// nouveaux, crée les notifications et les pousse en temps réel via la room user:<id>.
//
// Idempotent : `@@unique([userId, achievementId])` + `createMany(skipDuplicates)` — un
// même succès n'est jamais inséré ni notifié deux fois, même en cas d'appels concurrents.

import prisma from '@/lib/prisma';
import { evaluateAchievements, type EvaluatedAchievement } from '@/lib/achievements';
import { computeUserStats } from '@/lib/userStats';
import { pushToUser } from '@/lib/messages';

export interface AchievementNotificationPayload {
    id: string;
    achievementId: string;
    title: string;
    body: string;
    icon: string;
    link: string;
}

/**
 * Synchronise les succès d'un joueur. Renvoie ceux nouvellement débloqués (vide si aucun).
 * Ne lève jamais : toute erreur est avalée (la partie ne doit pas échouer pour un succès).
 */
export async function syncAchievements(userId: string): Promise<EvaluatedAchievement[]> {
    try {
        const [stats, already, user] = await Promise.all([
            computeUserStats(userId),
            prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
            prisma.user.findUnique({ where: { id: userId }, select: { username: true } }),
        ]);

        const persisted = new Set(already.map(a => a.achievementId));
        const newlyUnlocked = evaluateAchievements(stats).filter(a => a.unlocked && !persisted.has(a.id));
        if (newlyUnlocked.length === 0) return [];

        const link = `/user/${user?.username ?? userId}#stats`;

        // Insertion idempotente. skipDuplicates couvre la course entre deux parties
        // terminées quasi simultanément qui débloqueraient le même succès.
        await prisma.userAchievement.createMany({
            data: newlyUnlocked.map(a => ({ userId, achievementId: a.id })),
            skipDuplicates: true,
        });

        // Une notification persistée par succès (backlog de la cloche).
        await prisma.notification.createMany({
            data: newlyUnlocked.map(a => ({
                userId,
                type: 'achievement',
                title: 'Succès débloqué !',
                body: a.label,
                icon: a.id, // clé d'icône : la galerie résout id → SVG

                link,
            })),
        });

        // Récupère les notifications créées (avec leur id) pour les pousser en temps réel.
        const created = await prisma.notification.findMany({
            where: { userId, type: 'achievement', readAt: null },
            orderBy: { createdAt: 'desc' },
            take: newlyUnlocked.length,
        });

        // Push best-effort — chaque notif arrive instantanément dans la room user:<id>.
        await Promise.all(
            created.map(n =>
                pushToUser(userId, 'notification', {
                    id: n.id,
                    type: n.type,
                    title: n.title,
                    body: n.body,
                    icon: n.icon,
                    link: n.link,
                    createdAt: n.createdAt,
                }),
            ),
        );

        return newlyUnlocked;
    } catch (err) {
        console.error('[syncAchievements] error:', err);
        return [];
    }
}
