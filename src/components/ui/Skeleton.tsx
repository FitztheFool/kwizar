import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
    return (
        <div className={cn('relative overflow-hidden rounded-lg bg-black/[0.06] dark:bg-white/[0.06]', className)}>
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
    );
}
