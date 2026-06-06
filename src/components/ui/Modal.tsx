'use client';

import { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/cn';

export function Modal({
    open,
    onClose,
    title,
    children,
    className,
}: {
    open: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            <div
                role="dialog"
                aria-modal="true"
                className={cn('glass-strong relative w-full max-w-md rounded-2xl p-5 animate-scale-in', className)}
            >
                {title && (
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
                        <button
                            onClick={onClose}
                            aria-label="Fermer"
                            className="rounded-lg p-1 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}
