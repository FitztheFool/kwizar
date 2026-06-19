'use client';

import type { Socket } from 'socket.io-client';
import Toggle from '@/components/Lobby/forms/Toggle';

interface Props {
    isHost: boolean;
    socket: Socket | null;
    placement: 'auto' | 'manual';
    setPlacement: (v: 'auto' | 'manual') => void;
    earlyEnd: boolean;
    setEarlyEnd: (v: boolean) => void;
}

export default function AtlantideOptions({ isHost, socket, placement, setPlacement, earlyEnd, setEarlyEnd }: Props) {
    const emit = (next: { placement?: 'auto' | 'manual'; earlyEnd?: boolean }) =>
        socket?.emit('lobby:setAtlantideOptions', next);

    return (
        <div className={`bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700/50 rounded-2xl p-5 space-y-4 ${!isHost ? 'opacity-60 pointer-events-none' : ''}`}>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Options Atlantide</p>

            <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">Placement des pions</label>
                <div className="flex rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
                    {(['auto', 'manual'] as const).map(mode => (
                        <button
                            key={mode}
                            type="button"
                            disabled={!isHost}
                            onClick={() => { setPlacement(mode); emit({ placement: mode }); }}
                            className={`flex-1 text-xs font-semibold py-2 transition-colors ${placement === mode ? 'bg-primary-600 text-white' : 'bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            {mode === 'auto' ? 'Automatique' : 'Manuel'}
                        </button>
                    ))}
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    {placement === 'auto' ? 'Les 12 pions de chaque joueur sont répartis au hasard.' : 'Chacun place ses 12 pions, un par un (plage : 1 pion max au départ).'}
                </p>
            </div>

            <Toggle
                checked={earlyEnd}
                onChange={v => { setEarlyEnd(v); emit({ earlyEnd: v }); }}
                label="Fin anticipée (1er à tout sauver)"
                disabled={!isHost}
            />
            <p className="text-[11px] text-gray-400 dark:text-gray-500 -mt-2">
                Variante : la partie s'arrête dès qu'un joueur a mis tous ses pions survivants à l'abri.
            </p>
        </div>
    );
}
