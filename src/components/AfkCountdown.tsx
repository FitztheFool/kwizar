'use client';

import { useEffect, useState } from 'react';

export default function AfkCountdown({ endsAt }: { endsAt: number }) {
    const [secs, setSecs] = useState(() => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    useEffect(() => {
        const id = setInterval(() => setSecs(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))), 1000);
        return () => clearInterval(id);
    }, [endsAt]);
    return (
        <span className={`font-bold px-1 rounded text-xs ${secs <= 10 ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>
            ⏰{secs}s
        </span>
    );
}
