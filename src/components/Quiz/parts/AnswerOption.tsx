import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Props {
    label: string;
    text: string;
    isSelected: boolean;
    showCorrect: boolean;
    showWrong: boolean;
    disabled: boolean;
    onClick: () => void;
}

export default function AnswerOption({ label, text, isSelected, showCorrect, showWrong, disabled, onClick }: Props) {
    const rowCls = showCorrect
        ? 'border-success bg-success/15 text-success ring-2 ring-success/40'
        : showWrong
            ? 'border-danger/40 bg-danger/10 text-danger'
            : isSelected
                ? 'border-primary-400 bg-primary-500/30 text-amber-950 dark:text-amber-50 ring-2 ring-primary-400/60 shadow-md'
                : 'border-amber-700/30 bg-amber-900/20 text-amber-900 dark:text-amber-100 hover:border-amber-700/60 hover:bg-amber-900/30 cursor-pointer';

    const badgeCls = showCorrect
        ? 'bg-success text-white'
        : showWrong
            ? 'bg-danger text-white'
            : isSelected
                ? 'bg-primary-500 text-stone-950'
                : 'bg-amber-900/30 text-amber-900 dark:text-amber-100';

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 font-medium transition-all duration-150 select-none ${rowCls}`}
        >
            <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${badgeCls}`}>
                {showCorrect ? <CheckIcon className="w-4 h-4" /> : showWrong ? <XMarkIcon className="w-4 h-4" /> : label}
            </span>
            <span>{text}</span>
        </button>
    );
}
