import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';
import { Spinner } from './Spinner';

const button = cva(
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 active:scale-[0.98] focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap',
    {
        variants: {
            variant: {
                primary: 'text-white bg-accent-gradient shadow-glow hover:brightness-110',
                secondary:
                    'glass text-gray-900 dark:text-white hover:bg-white/80 dark:hover:bg-white/[0.08]',
                ghost: 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5',
                danger: 'text-white bg-red-600 hover:bg-red-500 shadow-sm',
                subtle:
                    'bg-primary-500/10 text-primary-700 dark:text-primary-300 hover:bg-primary-500/20',
            },
            size: {
                sm: 'h-8 px-3 text-xs',
                md: 'h-10 px-4 text-sm',
                lg: 'h-12 px-6 text-base',
                icon: 'h-10 w-10 p-0',
            },
        },
        defaultVariants: { variant: 'primary', size: 'md' },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof button> {
    loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
        <button
            ref={ref}
            className={cn(button({ variant, size }), className)}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <Spinner className="w-4 h-4" />}
            {children}
        </button>
    ),
);
Button.displayName = 'Button';
