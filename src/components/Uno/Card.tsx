'use client';

import { CARD_GRADIENT, VALUE_LABEL, type UnoCard } from './constants';

interface Props {
    card: UnoCard;
    playable?: boolean;
    selected?: boolean;
    size?: 'md' | 'sm';
    onClick?: () => void;
}

const SIZE = {
    md: { box: 'w-16 h-24 border-[3px]', oval: 'inset-2', corner: 'text-[10px]', tl: 'top-1 left-1.5', br: 'bottom-1 right-1.5', center: 'text-2xl' },
    sm: { box: 'w-9 h-14 border-2', oval: 'inset-1', corner: 'text-[7px]', tl: 'top-0.5 left-1', br: 'bottom-0.5 right-1', center: 'text-sm' },
} as const;

export default function Card({ card, playable, selected, size = 'md', onClick }: Props) {
    const label = VALUE_LABEL[card.value] ?? card.value;
    const gradient = CARD_GRADIENT[card.color] ?? 'bg-gray-400';
    const s = SIZE[size];
    return (
        <div onClick={onClick} className={`
            relative ${s.box} ${gradient} rounded-xl border-white shadow-lg
            flex items-center justify-center font-black text-white
            select-none transition-all duration-200 overflow-hidden
            ${playable ? 'cursor-pointer hover:-translate-y-3 hover:shadow-2xl hover:scale-105 ring-2 ring-white/60' : onClick ? 'opacity-60 cursor-default' : 'cursor-default'}
            ${selected ? '-translate-y-4 ring-4 ring-yellow-300 shadow-yellow-300/40 shadow-2xl scale-105' : ''}
        `}>
            {/* Oval white center for classic UNO look */}
            <span className={`absolute ${s.oval} rounded-full bg-white/10 -rotate-[20deg] pointer-events-none`} />
            {/* Corner labels */}
            <span className={`absolute ${s.tl} ${s.corner} font-black leading-none`}>{label}</span>
            <span className={`absolute ${s.br} ${s.corner} font-black leading-none rotate-180`}>{label}</span>
            {/* Center value */}
            <span className={`relative z-10 ${s.center} drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]`}>{label}</span>
        </div>
    );
}
