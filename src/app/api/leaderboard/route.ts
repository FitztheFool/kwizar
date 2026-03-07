// src/app/api/leaderboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get('quizId');

    if (quizId) {
      const attempts = await prisma.attempt.findMany({
        where: {
          quizId,
          user: { role: { notIn: ['ADMIN', 'RANDOM'] } },
        },
        include: {
          user: { select: { id: true, username: true } },
          quiz: { select: { title: true } },
        },
        orderBy: { score: 'desc' },
        take: 100,
      });

      const bestByUser = new Map<string, typeof attempts[0]>();
      for (const attempt of attempts) {
        const existing = bestByUser.get(attempt.userId);
        if (!existing || attempt.score > existing.score) {
          bestByUser.set(attempt.userId, attempt);
        }
      }

      const leaderboard = attempts
        .filter(attempt => attempt.quiz !== null)
        .map(attempt => ({
          username: attempt.user.username,
          userId: attempt.user.id,
          score: attempt.score,
          completedAt: attempt.createdAt,
          quizTitle: attempt.quiz!.title,
        }));

      return NextResponse.json({ type: 'quiz', quizId, leaderboard });
    }

    // Classement global — meilleur score par quiz par utilisateur
    const eligibleUsers = await prisma.user.findMany({
      where: { role: { notIn: ['ADMIN', 'RANDOM'] } },
      select: { id: true, username: true },
    });

    const eligibleUserIds = eligibleUsers.map((u) => u.id);

    // Récupérer toutes les tentatives des utilisateurs éligibles
    const allAttempts = await prisma.attempt.findMany({
      where: { userId: { in: eligibleUserIds } },
      select: { userId: true, quizId: true, score: true },
    });

    // Pour chaque utilisateur, garder le meilleur score par quiz puis sommer
    const totalByUser = new Map<string, { total: number; quizzes: Set<string> }>();

    for (const attempt of allAttempts) {
      if (!totalByUser.has(attempt.userId)) {
        totalByUser.set(attempt.userId, { total: 0, quizzes: new Set() });
      }

      const userEntry = totalByUser.get(attempt.userId)!;

      // Recalculer le meilleur score pour ce quiz
      const bestForThisQuiz = allAttempts
        .filter((a) => a.userId === attempt.userId && a.quizId === attempt.quizId)
        .reduce((max, a) => Math.max(max, a.score), 0);

      // Mettre à jour seulement si ce quiz n'a pas encore été comptabilisé
      if (attempt.quizId && !userEntry.quizzes.has(attempt.quizId)) {
        userEntry.quizzes.add(attempt.quizId);
        userEntry.total += bestForThisQuiz;
      }
    }

    const leaderboard = Array.from(totalByUser.entries())
      .map(([userId, data]) => {
        const user = eligibleUsers.find((u) => u.id === userId);
        return {
          userId,
          username: user?.username || 'Utilisateur inconnu',
          totalScore: data.total,
          quizzesCompleted: data.quizzes.size,
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 100)
      .map((entry, index) => ({ rank: index + 1, ...entry }));

    return NextResponse.json({ type: 'global', leaderboard });
  } catch (error) {
    console.error('Erreur lors de la récupération du classement:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
