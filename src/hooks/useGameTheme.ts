'use client';

import { useEffect, useState } from 'react';

/** Tracks the document `dark` class and re-renders when it changes. */
export function useGameTheme(): boolean {
    const [dark, setDark] = useState(false);
    useEffect(() => {
        const update = () => setDark(document.documentElement.classList.contains('dark'));
        update();
        const obs = new MutationObserver(update);
        obs.observe(document.documentElement, { attributeFilter: ['class'] });
        return () => obs.disconnect();
    }, []);
    return dark;
}
