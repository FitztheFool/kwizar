import { cn } from '@/lib/cn';

export function Card({
    className,
    glow,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & { glow?: boolean }) {
    return (
        <div
            className={cn(
                'glass rounded-2xl',
                glow && 'transition-shadow hover:shadow-glow',
                className,
            )}
            {...props}
        />
    );
}
