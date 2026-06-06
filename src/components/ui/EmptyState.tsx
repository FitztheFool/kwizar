import { cn } from '@/lib/cn';

export function EmptyState({
    icon,
    title,
    description,
    action,
    className,
}: {
    icon?: React.ReactNode;
    title: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('flex flex-col items-center justify-center px-4 py-12 text-center', className)}>
            {icon && (
                <div className="glass mb-3 flex h-12 w-12 items-center justify-center rounded-2xl text-gray-400">
                    {icon}
                </div>
            )}
            <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
            {description && (
                <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
