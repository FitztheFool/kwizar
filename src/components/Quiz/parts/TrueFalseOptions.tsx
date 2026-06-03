import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { Question, Feedback } from '@/hooks/useQuizPlayer';

interface Props {
    question: Question;
    selectedAnswer: string | null;
    feedback: Feedback | null;
    showFeedback: boolean;
    onSelect: (id: string) => void;
}

export default function TrueFalseOptions({ question, selectedAnswer, feedback, showFeedback, onSelect }: Props) {
    return (
        <div className="grid grid-cols-2 gap-3">
            {question.answers?.map((answer) => {
                const isSelected = selectedAnswer === answer.id;
                const showCorrect = showFeedback && feedback?.correctAnswerText === answer.text;
                const showWrong = showFeedback && isSelected && !showCorrect;
                return (
                    <button
                        key={answer.id}
                        onClick={() => onSelect(answer.id)}
                        disabled={showFeedback}
                        className={`flex items-center justify-center py-6 rounded-xl border-2 font-bold text-lg transition-all duration-150 select-none
                            ${showCorrect
                                ? 'border-felt-500 bg-felt-500/20 text-felt-800 dark:text-felt-100 ring-2 ring-felt-500/40 scale-[1.02]'
                                : showWrong
                                    ? 'border-red-400 bg-red-50 dark:bg-red-900/25 text-red-700 dark:text-red-300'
                                    : isSelected
                                        ? 'border-primary-400 bg-primary-500/30 text-amber-950 dark:text-amber-50 ring-2 ring-primary-400/60 scale-[1.02]'
                                        : 'border-amber-700/30 bg-amber-900/20 text-amber-900 dark:text-amber-100 hover:border-amber-700/60 hover:bg-amber-900/30 cursor-pointer'
                            }`}
                    >
                        {showCorrect ? <CheckIcon className="w-5 h-5" /> : showWrong ? <XMarkIcon className="w-5 h-5" /> : answer.text}
                    </button>
                );
            })}
        </div>
    );
}
