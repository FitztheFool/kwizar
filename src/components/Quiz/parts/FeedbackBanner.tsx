import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { Feedback } from '@/hooks/useQuizPlayer';

interface Props {
    feedback: Feedback;
}

export default function FeedbackBanner({ feedback }: Props) {
    return (
        <div className={`mx-4 mb-4 flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-sm border
            ${feedback.isCorrect
                ? 'bg-success/15 text-success border-success/40'
                : 'bg-danger/10 text-danger border-danger/30'
            }`}>
            <span className="shrink-0">{feedback.isCorrect ? <CheckIcon className="w-5 h-5" /> : <XMarkIcon className="w-5 h-5" />}</span>
            <span>{feedback.isCorrect ? 'Bonne réponse !' : 'Mauvaise réponse'}</span>
        </div>
    );
}
