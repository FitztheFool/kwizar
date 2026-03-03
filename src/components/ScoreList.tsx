import Link from 'next/link';

interface Score {
    quiz: { id: string; title: string };
    totalScore: number;
    completedAt: string;
    maxScore?: number;
    attempts?: number;
}

export default function ScoreList({ scores }: { scores: Score[] }) {
    return (
        <div className="space-y-3">
            {scores.map((score, index) => {
                const totalPoints = score.maxScore || 0;
                const pct = totalPoints > 0 ? Math.round((score.totalScore / totalPoints) * 100) : 0;
                const color = pct >= 80 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
                return (
                    <div key={index} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                            <Link
                                href={`/quiz/${score.quiz.id}`}
                                className="text-sm font-semibold text-gray-800 hover:text-blue-600 truncate block"
                            >
                                {score.quiz.title}
                            </Link>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(score.completedAt).toLocaleDateString('fr-FR', {
                                    day: '2-digit', month: 'short', year: 'numeric',
                                })}
                                {score.attempts && score.attempts > 1 && (
                                    <span className="ml-2">· {score.attempts} essai{score.attempts > 1 ? 's' : ''}</span>
                                )}
                            </p>
                            {totalPoints > 0 && (
                                <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{ width: `${pct}%`, backgroundColor: color }}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="text-right shrink-0">
                            <span className="text-base font-bold" style={{ color }}>{score.totalScore}</span>
                            {totalPoints > 0 && <span className="text-xs text-gray-400">/{totalPoints}</span>}
                            {totalPoints > 0 && <p className="text-xs font-medium mt-0.5" style={{ color }}>{pct}%</p>}
                        </div>
                        <Link
                            href={`/quiz/${score.quiz.id}`}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-md text-sm whitespace-nowrap"
                        >
                            Jouer →
                        </Link>
                    </div>
                );
            })}
        </div>
    );
}
