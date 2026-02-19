// app/api/quiz/[id]/submit/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface UserAnswer {
  questionId: string;
  answerId?: string;
  answerIds?: string[];
  freeText?: string;
}

type QuestionResult = {
  questionId: string;
  questionText: string;
  type: 'TRUE_FALSE' | 'MCQ' | 'TEXT' | 'MULTI_TEXT';
  points: number;
  isCorrect: boolean;
  correctAnswerTexts: string[];
  userAnswerTexts: string[];
  userFreeText?: string;
};

function normalizeIds(ids: string[]) {
  return Array.from(new Set(ids)).sort();
}

function answerLabel(a: any) {
  return String(a?.text ?? a?.content ?? '').trim();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    const { id: quizId } = await params;
    const body = await request.json();
    const answers = (body?.answers ?? []) as UserAnswer[];

    if (!Array.isArray(answers)) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        creator: { select: { id: true } },
        questions: { include: { answers: true } },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 });
    }

    let totalScore = 0;
    let totalPoints = 0;
    const details: QuestionResult[] = [];

    for (const question of quiz.questions) {
      totalPoints += question.points;

      const userAnswer = answers.find((a) => a.questionId === question.id);

      const correctAnswers = question.answers.filter((a) => a.isCorrect);
      const correctIds = normalizeIds(correctAnswers.map((a) => a.id));
      const correctTexts = correctAnswers.map((a) => answerLabel(a)).filter(Boolean);

      let isCorrect = false;
      let userTexts: string[] = [];

      if (question.type === 'TRUE_FALSE') {
        if (userAnswer?.answerId) {
          const selected = question.answers.find((a) => a.id === userAnswer.answerId);
          if (selected) {
            userTexts = [answerLabel(selected)].filter(Boolean);
            isCorrect = !!selected.isCorrect;
          }
        }
      }

      if (question.type === 'MCQ') {
        const rawUserIds =
          userAnswer?.answerIds?.length
            ? userAnswer.answerIds
            : userAnswer?.answerId
              ? [userAnswer.answerId]
              : [];

        const userIds = normalizeIds(rawUserIds);

        userTexts = userIds
          .map((id) => question.answers.find((a) => a.id === id))
          .filter(Boolean)
          .map((a) => answerLabel(a))
          .filter(Boolean);

        isCorrect =
          correctIds.length === userIds.length &&
          correctIds.every((id, i) => id === userIds[i]);
      }

      if (question.type === 'TEXT') {
        const correct = correctAnswers[0];
        if (correct && userAnswer?.freeText) {
          const userText = userAnswer.freeText.trim().toLowerCase();
          const correctText = answerLabel(correct).trim().toLowerCase();
          isCorrect = userText.length > 0 && userText === correctText;
          userTexts = [userAnswer.freeText];
        }
      }

      if (question.type === 'MULTI_TEXT') {
        const userTextList = userAnswer?.freeText?.split('||').map(t => t.trim().toLowerCase()) ?? [];
        const correctTextList = correctAnswers.map(a => answerLabel(a).trim().toLowerCase());
        const strictOrder = (question as any).strictOrder ?? false;

        let correctCount = 0;
        if (strictOrder) {
          correctCount = userTextList.filter((t, i) => t === correctTextList[i]).length;
        } else {
          correctCount = userTextList.filter(t => correctTextList.includes(t)).length;
        }

        const pointsPerAnswer = question.points / correctTextList.length;
        const earnedPoints = Math.round(correctCount * pointsPerAnswer);

        isCorrect = correctCount === correctTextList.length;
        totalScore += earnedPoints;

        details.push({
          questionId: question.id,
          questionText: question.content,
          type: question.type as any,
          points: question.points,
          isCorrect,
          correctAnswerTexts: correctTexts,
          userAnswerTexts: userTexts,
          userFreeText: userAnswer?.freeText,
        });

        continue; // skip le totalScore générique en bas
      }

      if (isCorrect) totalScore += question.points;

      details.push({
        questionId: question.id,
        questionText: question.content,
        type: question.type as any,
        points: question.points,
        isCorrect,
        correctAnswerTexts: correctTexts,
        userAnswerTexts: userTexts,
        userFreeText: userAnswer?.freeText,
      });
    }

    // Sauvegarde uniquement si l'utilisateur est connecté et n'est pas le créateur
    if (session?.user?.id && session.user.id !== quiz.creatorId) {
      const existingScore = await prisma.score.findUnique({
        where: {
          userId_quizId: {
            userId: session.user.id,
            quizId: quizId,
          },
        },
      });

      if (!existingScore || totalScore > existingScore.totalScore) {
        await prisma.score.upsert({
          where: {
            userId_quizId: {
              userId: session.user.id,
              quizId: quizId,
            },
          },
          update: { totalScore },
          create: {
            userId: session.user.id,
            quizId: quizId,
            totalScore,
          },
        });
      }
    }

    return NextResponse.json({
      score: totalScore,
      totalPoints,
      percentage: totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0,
      details,
    });
  } catch (error) {
    console.error('Erreur lors de la soumission:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
