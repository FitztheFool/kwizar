'use client';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

interface Props {
    icon: string;
    iconSrc?: { light: string; dark: string };
    className?: string;
}

export default function GameIcon({ icon, iconSrc, className = 'w-5 h-5' }: Props) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (iconSrc) {
        const src = mounted && resolvedTheme === 'dark' ? iconSrc.light : iconSrc.dark;
        return <img src={src} className={className} alt="" aria-hidden />;
    }
    return <>{icon}</>;
}
