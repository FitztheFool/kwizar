// src/lib/userProfile.ts
// Données de profil public partagées : utilisées par l'API (/api/user/[username])
// ET par le rendu serveur des pages /dashboard et /user/[username] (SSR → fallbackData
// SWR, plus de spinner au 1er rendu). Les dates sont sérialisées (ISO) pour coller
// exactement à la réponse JSON de l'API que SWR revalidera ensuite.
import prisma from '@/lib/prisma';

export interface ProfileQuiz {
    id: string;
    title: string;
    description: string | null;
    isPublic: boolean;
    imageUrl?: string | null;
    createdAt?: string;
    creatorId?: string;
    creator?: { id: string; username: string } | null;
    _count: { questions: number };
    category?: { name: string } | null;
    questions?: { points: number }[];
}

export interface ProfileData {
    id: string;
    name: string | null;
    image?: string | null;
    totalScore: number;
    quizzesCompleted: number;
    quizzesCreated: number;
    quizzes: ProfileQuiz[];
}

/** Profil public d'un utilisateur, ou `null` si introuvable/désactivé.
 *  `viewerId` : id du visiteur (pour inclure ses quiz privés s'il regarde son propre profil). */
export async function getUserProfile(username: string, viewerId?: string | null): Promise<ProfileData | null> {
    if (!username) return null;

    const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true, name: true, username: true, image: true, deletedAt: true, deactivatedAt: true },
    });
    if (!user || user.deletedAt || user.deactivatedAt) return null;

    const isOwner = viewerId != null && viewerId === user.id;

    const createdQuizzes = await prisma.quiz.findMany({
        where: { creatorId: user.id, ...(isOwner ? {} : { isPublic: true }) },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true, title: true, description: true, isPublic: true, imageUrl: true,
            createdAt: true, creatorId: true,
            category: { select: { name: true } },
            _count: { select: { questions: true } },
            questions: { select: { points: true } },
        },
    });

    const attempts = await prisma.attempt.findMany({
        where: { userId: user.id },
        select: { score: true, gameType: true },
    });
    const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);
    const quizzesCompleted = attempts.filter(a => a.gameType === 'QUIZ').length;

    return {
        id: user.id,
        name: user.username ?? user.name,
        image: user.image,
        totalScore,
        quizzesCompleted,
        quizzesCreated: createdQuizzes.length,
        quizzes: createdQuizzes.map(q => ({ ...q, createdAt: q.createdAt.toISOString() })),
    };
}
