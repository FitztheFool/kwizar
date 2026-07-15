import type { Feedback } from '@/hooks/useQuizPlayer';

interface Props {
    value: string;
    onChange: (v: string) => void;
    disabled: boolean;
    feedback: Feedback | null;
    showFeedback: boolean;
    /** Entrée → valider la réponse. */
    onEnter?: () => void;
}

export default function TextInput({ value, onChange, disabled, feedback, showFeedback, onEnter }: Props) {
    return (
        <div className="flex flex-col gap-2">
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !disabled) { e.preventDefault(); onEnter?.(); } }}
                disabled={disabled}
                autoFocus
                placeholder="Votre réponse..."
                className={`w-full px-4 py-3.5 rounded-xl border-2 text-amber-950 dark:text-amber-100 placeholder-amber-700/50 dark:placeholder-amber-200/40 focus:outline-none transition-colors disabled:opacity-60
                    ${showFeedback
                        ? feedback?.isCorrect
                            ? 'border-success bg-success/15'
                            : 'border-danger/40 bg-danger/10'
                        : 'border-amber-700/30 bg-amber-900/20 focus:border-amber-700/70 focus:bg-amber-900/30'
                    }`}
            />
            {showFeedback && !feedback?.isCorrect && feedback?.correctAnswerText && (
                <p className="text-sm text-success px-1">
                    Bonne réponse : <strong>{feedback.correctAnswerText}</strong>
                </p>
            )}
        </div>
    );
}
