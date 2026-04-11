import { ReactNode } from 'react';

export default function GamePageHeader({ left, center, right }: {
    left: ReactNode;
    center?: ReactNode;
    right?: ReactNode;
}) {
    return (
        <header className="shrink-0 h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 sm:px-4 flex items-center gap-2 sm:gap-4">
            <div className="flex-1 flex items-center gap-2 min-w-0">
                {left}
            </div>
            <div className="shrink-0 flex justify-center items-center gap-2">
                {center}
            </div>
            <div className="flex-1 flex justify-end items-center gap-2 min-w-0">
                {right}
            </div>
        </header>
    );
}
