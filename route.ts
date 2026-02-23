import { NextRequest, NextResponse } from 'next/server';
import { groqClient, GROQ_MODEL } from '@/lib/openai';

const buildPrompt = (subject: string, questionCount: number, difficulty: string) =>
    `Génère un quiz de niveau ${difficulty} sur le sujet : "${subject}".
Le quiz doit contenir exactement ${questionCount} questions variées (mélange de MCQ, TRUE_FALSE, TEXT).

Adapte la complexité des questions au niveau ${difficulty} :
- facile : questions simples, accessibles à tous
- normal : questions de niveau intermédiaire
- difficile : questions pointues pour experts

Réponds UNIQUEMENT avec un JSON valide, sans texte autour, sans balises markdown, au format suivant :
{
  "title": "Titre du quiz",
  "description": "Brève description",
  "isPublic": true,
  "questions": [
    {
      "text": "Texte de la question",
      "type": "MCQ",
      "points": 3,
      "answers": [
        { "text": "Réponse A", "isCorrect": false },
        { "text": "Réponse B", "isCorrect": true },
        { "text": "Réponse C", "isCorrect": false },
        { "text": "Réponse D", "isCorrect": false }
      ]
    },
    {
      "text": "Affirmation vrai ou faux",
      "type": "TRUE_FALSE",
      "points": 2,
      "answers": [
        { "text": "Vrai", "isCorrect": true },
        { "text": "Faux", "isCorrect": false }
      ]
    },
    {
      "text": "Question à réponse courte",
      "type": "TEXT",
      "points": 5,
      "answers": [
        { "text": "réponse attendue", "isCorrect": true }
      ]
    }
  ]
}`;

export async function POST(req: NextRequest) {
    const { subject, questionCount = 5, difficulty = 'normal' } = await req.json();

    if (!subject?.trim()) {
        return NextResponse.json({ error: 'Sujet requis' }, { status: 400 });
    }

    try {
        const startTime = Date.now();

        const completion = await groqClient.chat.completions.create({
            model: GROQ_MODEL,
            messages: [{ role: 'user', content: buildPrompt(subject, questionCount, difficulty) }],
            temperature: 0.7,
        });

        console.log(`⏱️ Groq response time: ${Date.now() - startTime}ms`);

        const text = (completion.choices[0].message.content ?? '').trim()
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '');

        const json = JSON.parse(text);

        return NextResponse.json({ ...json, provider: 'groq' });

    } catch (e: any) {
        console.error('Erreur génération Groq:', e.message);
        return NextResponse.json({
            error: 'Erreur lors de la génération : ' + e.message,
        }, { status: 500 });
    }
}
