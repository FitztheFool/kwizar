import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

const fieldBase =
    'w-full rounded-xl bg-white/60 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-transparent transition';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => (
        <input ref={ref} className={cn(fieldBase, 'h-10 px-3.5', className)} {...props} />
    ),
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className, ...props }, ref) => (
        <textarea ref={ref} className={cn(fieldBase, 'min-h-[88px] px-3.5 py-2.5 resize-y', className)} {...props} />
    ),
);
Textarea.displayName = 'Textarea';

export function Field({
    label,
    error,
    hint,
    className,
    children,
}: {
    label?: React.ReactNode;
    error?: string | null;
    hint?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <label className={cn('block', className)}>
            {label && (
                <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
            )}
            {children}
            {error ? (
                <span className="mt-1 block text-xs text-red-500">{error}</span>
            ) : hint ? (
                <span className="mt-1 block text-xs text-gray-400 dark:text-gray-500">{hint}</span>
            ) : null}
        </label>
    );
}
