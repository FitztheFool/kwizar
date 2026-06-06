import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badge = cva('inline-flex items-center gap-1 rounded-full font-semibold text-xs px-2.5 py-0.5', {
    variants: {
        variant: {
            default: 'bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300',
            primary: 'bg-primary-500/15 text-primary-700 dark:text-primary-300',
            felt: 'bg-felt-500/15 text-felt-700 dark:text-felt-300',
            danger: 'bg-red-500/15 text-red-600 dark:text-red-400',
        },
    },
    defaultVariants: { variant: 'default' },
});

export function Badge({
    className,
    variant,
    ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge>) {
    return <span className={cn(badge({ variant }), className)} {...props} />;
}
