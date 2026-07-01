import type { ReactNode } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface Props {
    label: string;
    children: ReactNode;
    /** Infobulle (au survol) décrivant l'effet de l'option. */
    hint?: string;
}

export default function OptionRow({ label, children, hint }: Props) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-700 dark:text-gray-300 inline-flex items-center gap-1.5">
                {label}
                {hint && (
                    <span title={hint} aria-label={hint}
                        className="cursor-help text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <InformationCircleIcon className="w-4 h-4" />
                    </span>
                )}
            </span>
            <div className="flex-shrink-0">{children}</div>
        </div>
    );
}
