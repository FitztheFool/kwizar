'use client';

import { cn } from '@/lib/cn';

export interface TabItem<T extends string> {
    value: T;
    label: React.ReactNode;
}

export function Tabs<T extends string>({
    tabs,
    value,
    onChange,
    className,
}: {
    tabs: TabItem<T>[];
    value: T;
    onChange: (v: T) => void;
    className?: string;
}) {
    return (
        <div role="tablist" className={cn('inline-flex gap-1 rounded-xl bg-black/5 p-1 dark:bg-white/5', className)}>
            {tabs.map(t => (
                <button
                    key={t.value}
                    role="tab"
                    aria-selected={value === t.value}
                    onClick={() => onChange(t.value)}
                    className={cn(
                        'flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all',
                        value === t.value
                            ? 'bg-white text-primary-700 shadow-sm dark:bg-white/10 dark:text-primary-300'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                    )}
                >
                    {t.label}
                </button>
            ))}
        </div>
    );
}
