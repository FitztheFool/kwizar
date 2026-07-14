'use client';

import Image from 'next/image';
import { userInitials, userColorClass } from '@/lib/userColor';

interface Props {
    /**
     * Graine de la couleur d'avatar. À défaut, on retombe sur `name` — toujours fourni
     * et stable par personne, donc la couleur reste la même sur toutes les surfaces.
     */
    seed?: string;
    /** Display name used for initials and alt text. */
    name: string;
    /** Optional profile picture URL. When present, overrides the colored avatar. */
    image?: string | null;
    /** Avatar size. Defaults to `md` (40px). */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** Shape: `square` (rounded square) or `round` (circle). Defaults to `square`. */
    shape?: 'square' | 'round';
    /** Show a small green online dot in the bottom-right corner. */
    online?: boolean;
    className?: string;
}

const SIZE_CLASS: Record<NonNullable<Props['size']>, string> = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
};

const DOT_SIZE: Record<NonNullable<Props['size']>, string> = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
};

export default function UserAvatar({
    seed, name, image, size = 'md', shape = 'square', online, className = '',
}: Props) {
    const radius = shape === 'round' ? 'rounded-full' : 'rounded-xl';
    const sizeCls = SIZE_CLASS[size];
    const dotCls = DOT_SIZE[size];
    // userColorClass() existait déjà mais n'était pas branché : tout le monde héritait
    // d'un dégradé sky→indigo figé — du bleu en dur, incohérent avec le thème rouge.
    // L'identité de la personne est un axe légitime, distinct de la marque et du jeu.
    const gradient = userColorClass(seed ?? name);

    return (
        <div className={`relative ${sizeCls} shrink-0 ${className}`}>
            {image ? (
                <Image src={image} alt={name} fill sizes="80px" className={`object-cover ${radius}`} />
            ) : (
                <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black ${radius} shadow-sm`}>
                    {userInitials(name)}
                </div>
            )}
            {online && (
                <span className={`absolute -bottom-0.5 -right-0.5 ${dotCls} rounded-full bg-success border-2 border-white dark:border-gray-950`} />
            )}
        </div>
    );
}
