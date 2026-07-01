// src/app/api/quiz/route.ts
import { NextRequest, NextResponse, after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { AI_MODELS } from '@/lib/aiModels';
import { generateQuestionImage } from '@/lib/quizImages';

const VALID_MODEL_IDS = new Set<string>(AI_MODELS.map(m => m.id));

// after() peut générer des images Flux (~25 s) post-réponse → on étend la durée max serverless.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') ?? '';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '12', 10) || 12));
    const categoryId = searchParams.get('categoryId');
    const onlyMine = searchParams.get('onlyMine') === 'true';
    const skip = (page - 1) * pageSize;

    const creatorId = searchParams.get('creatorId');

    const isOwnProfile = creatorId && session?.user?.id === creatorId;
    const where: any = {
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(creatorId
        ? { creatorId, ...(isOwnProfile ? {} : { isPublic: true, isDraft: false }) }
        : onlyMine && session?.user?.id
          ? { creatorId: session.user.id }
          : { isPublic: true, isDraft: false }),
    };

    const [quizzes, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          creator: { select: { id: true, username: true, email: true } },
          _count: { select: { questions: true, attempts: true } },
        },
      }),
      prisma.quiz.count({ where }),
    ]);

    return NextResponse.json({
      quizzes: quizzes.map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        imageUrl: q.imageUrl ?? null,
        isPublic: q.isPublic,
        isDraft: q.isDraft,
        category: q.category ?? null,
        creator: {
          id: q.creator.id,
          username: q.creator.username || q.creator.email?.split('@')[0] || 'Anonyme',
        },
        _count: {
          questions: q._count.questions,
          attempts: q._count.attempts,
        },
        createdAt: q.createdAt,
        generatedWithModel: q.generatedWithModel ?? null,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Erreur GET /api/quiz:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, isPublic, isDraft, randomizeQuestions, categoryId, imageUrl, questions, creatorRole, generatedWithModel } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Titre requis' }, { status: 400 });
    }

    const questionList = Array.isArray(questions) ? questions : [];

    // Un brouillon peut être incomplet (ni questions ni catégorie). Un quiz publié non.
    if (!isDraft && questionList.length === 0) {
      return NextResponse.json({ error: 'Au moins une question est requise' }, { status: 400 });
    }
    if (!isDraft && !categoryId) {
      return NextResponse.json({ error: 'Catégorie requise' }, { status: 400 });
    }

    if (questionList.length > 15) {
      return NextResponse.json({ error: 'Un quiz ne peut pas dépasser 15 questions.' }, { status: 400 });
    }

    let creatorId = session.user.id;
    if (creatorRole === 'RANDOM') {
      const randomUser = await prisma.user.findUnique({ where: { email: 'random@quiz.app' }, select: { id: true } });
      if (randomUser) creatorId = randomUser.id;
    }

    // Valide la catégorie : un id inexistant casserait la FK.
    let safeCategoryId: string | null = categoryId || null;
    if (safeCategoryId) {
      const cat = await prisma.category.findUnique({ where: { id: safeCategoryId }, select: { id: true } });
      if (!cat) {
        if (!isDraft) return NextResponse.json({ error: 'Catégorie introuvable' }, { status: 400 });
        safeCategoryId = null; // brouillon : on ignore une catégorie invalide
      }
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description: description ?? '',
        // Un brouillon reste privé tant qu'il n'est pas publié.
        isPublic: isDraft ? false : (isPublic ?? false),
        isDraft: !!isDraft,
        randomizeQuestions: randomizeQuestions ?? false,
        imageUrl: imageUrl || '/quiz/default-cover.svg',
        generatedWithModel: VALID_MODEL_IDS.has(generatedWithModel) ? generatedWithModel : null,
        creatorId,
        categoryId: safeCategoryId,
        questions: {
          create: questionList.map((q: any) => ({
            content: q.text,
            type: q.type,
            points: q.points ?? 1,
            strictOrder: q.strictOrder ?? false,
            imageUrl: q.imageUrl ?? null,
            answers: {
              create: (q.answers ?? []).map((a: any) => ({
                content: a.content,
                isCorrect: a.isCorrect,
              })),
            },
          })),
        },
      } as any,
      include: {
        creator: { select: { id: true, username: true } },
        questions: { include: { answers: true } },
      },
    });

    // Fallback images de questions (async) : pour chaque question marquée d'un `imageQuery`
    // par le LLM mais restée SANS image (Unsplash n'a rien trouvé), on génère une image Flux
    // après la réponse, puis on met à jour la ligne en DB. La création du quiz n'est pas ralentie.
    // Corrélation par contenu (pas de champ d'ordre fiable sur Question).
    const createdByContent = new Map<string, { id: string; imageUrl: string | null }[]>();
    for (const c of quiz.questions) {
      const arr = createdByContent.get(c.content) ?? [];
      arr.push({ id: c.id, imageUrl: c.imageUrl });
      createdByContent.set(c.content, arr);
    }
    const toIllustrate: { id: string; query: string }[] = [];
    for (const input of questionList as any[]) {
      const query = typeof input?.imageQuery === 'string' ? input.imageQuery.trim() : '';
      if (!query) continue;
      const match = createdByContent.get(input.text)?.find(c => !c.imageUrl);
      if (match) {
        toIllustrate.push({ id: match.id, query });
        match.imageUrl = 'pending'; // marque comme consommée (évite un double-match sur contenu identique)
      }
    }

    if (toIllustrate.length > 0) {
      after(async () => {
        await Promise.all(toIllustrate.map(async ({ id, query }) => {
          try {
            const url = await generateQuestionImage(query);
            if (url) await prisma.question.update({ where: { id }, data: { imageUrl: url } });
          } catch (e) {
            console.error('[quiz] fallback image question échoué:', e);
          }
        }));
      });
    }

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/quiz:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
