// src/app/quiz/[id]/print/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PrinterIcon } from '@heroicons/react/24/outline';

interface PrintAnswer { id?: string; text?: string; isCorrect?: boolean; }
interface PrintQuestion {
    id: string;
    text: string;
    type: string;
    points: number;
    imageUrl?: string | null;
    answers: PrintAnswer[];
}
interface PrintQuiz {
    id: string;
    title: string;
    description?: string;
    category?: { name: string } | null;
    creator?: { username: string };
    questions: PrintQuestion[];
}

export default function QuizPrintPage() {
    const { id } = useParams<{ id: string }>();
    const [quiz, setQuiz] = useState<PrintQuiz | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [withAnswers, setWithAnswers] = useState(false);

    useEffect(() => {
        document.body.classList.add('printing-quiz');
        return () => document.body.classList.remove('printing-quiz');
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const res = await fetch(`/api/quiz/${id}`, { cache: 'no-store' });
            if (cancelled) return;
            if (!res.ok) { setError((await res.json())?.error ?? 'Erreur'); return; }
            setQuiz(await res.json());
        })();
        return () => { cancelled = true; };
    }, [id]);

    if (error) return <main className="p-8 text-center text-red-600">{error}</main>;
    if (!quiz) return <main className="p-8 text-center text-gray-500">Chargement…</main>;

    // L'API ne révèle isCorrect qu'au propriétaire/admin : pas de réponse marquée = pas de corrigé dispo.
    const answersAvailable = quiz.questions.some(q => q.answers.some(a => a.isCorrect));

    return (
        <main className="mx-auto max-w-3xl p-6 sm:p-10 bg-white text-gray-900 print:p-0">
            {/* Barre d'actions — masquée à l'impression */}
            <div className="print:hidden mb-6 flex flex-wrap items-center gap-3 border-b pb-4">
                <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                    <PrinterIcon className="w-5 h-5" />Imprimer
                </button>
                {answersAvailable && (
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={withAnswers} onChange={e => setWithAnswers(e.target.checked)} />
                        Afficher le corrigé
                    </label>
                )}
            </div>

            {/* Identité Kwizar */}
            <div className="mb-6 flex items-center gap-2 border-b pb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo/icon-light.svg" alt="Kwizar" width={28} height={28} />
                <span className="text-lg font-bold text-indigo-600">Kwizar</span>
            </div>

            <header className="mb-8">
                <h1 className="text-3xl font-bold">{quiz.title}</h1>
                {quiz.description && <p className="mt-1 text-gray-600">{quiz.description}</p>}
                <p className="mt-2 text-sm text-gray-500">
                    {quiz.category?.name && <>Catégorie : {quiz.category.name} · </>}
                    {quiz.questions.length} question{quiz.questions.length > 1 ? 's' : ''}
                    {quiz.creator?.username && <> · par {quiz.creator.username}</>}
                </p>
            </header>

            <ol className="space-y-6">
                {quiz.questions.map((q, i) => (
                    <li key={q.id} className="break-inside-avoid">
                        <div className="flex items-baseline justify-between gap-4">
                            <p className="font-semibold">{i + 1}. {q.text}</p>
                            <span className="shrink-0 text-xs text-gray-500">{q.points} pt{q.points > 1 ? 's' : ''}</span>
                        </div>
                        {q.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={q.imageUrl} alt="" className="my-2 max-h-48 rounded border" />
                        )}
                        <ul className="mt-2 space-y-1 pl-1">
                            {q.answers.map((a, ai) => {
                                const correct = withAnswers && a.isCorrect;
                                return (
                                    <li key={a.id ?? ai} className="flex items-center gap-2">
                                        <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${correct ? 'border-green-600 bg-green-600 text-white' : 'border-gray-400'}`}>
                                            {correct ? '✓' : String.fromCharCode(65 + ai)}
                                        </span>
                                        <span className={correct ? 'font-semibold text-green-700' : ''}>
                                            {a.text ?? <span className="text-gray-400">…</span>}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </li>
                ))}
            </ol>

            <footer className="mt-10 pt-3 border-t text-center text-xs text-gray-400">
                Quiz généré sur Kwizar · kwizar
            </footer>
        </main>
    );
}
