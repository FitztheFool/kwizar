'use client';

import type { Socket } from 'socket.io-client';
import OptionRow from '@/components/Lobby/forms/OptionRow';
import OptionSelect from '@/components/Lobby/forms/OptionSelect';
import Toggle from '@/components/Lobby/forms/Toggle';

interface Props {
    isHost: boolean;
    socket: Socket | null;
    perudoInitialDice: number;
    setPerudoInitialDice: (n: number) => void;
    perudoCalza: boolean;
    setPerudoCalza: (v: boolean) => void;
}

export default function PerudoOptions({
    isHost, socket, perudoInitialDice, setPerudoInitialDice, perudoCalza, setPerudoCalza,
}: Props) {
    return (
        <div className={`bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700/50 rounded-2xl p-5 space-y-3 ${!isHost ? 'opacity-60 pointer-events-none' : ''}`}>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Options Perudo</p>

            <OptionRow
                label="Dés par joueur au départ"
                hint="Nombre de dés de chaque joueur en début de partie. Moins de dés = parties plus courtes."
            >
                <OptionSelect
                    value={String(perudoInitialDice)}
                    onChange={v => {
                        const n = Number(v);
                        setPerudoInitialDice(n);
                        socket?.emit('lobby:setPerudoOptions', { initialDice: n, calza: perudoCalza });
                    }}
                    options={[
                        { v: '3', label: '3 dés (court)' },
                        { v: '4', label: '4 dés' },
                        { v: '5', label: '5 dés (standard)' },
                        { v: '6', label: '6 dés (long)' },
                    ]}
                    disabled={!isHost}
                />
            </OptionRow>

            <Toggle
                checked={perudoCalza}
                onChange={v => {
                    setPerudoCalza(v);
                    socket?.emit('lobby:setPerudoOptions', { initialDice: perudoInitialDice, calza: v });
                }}
                label="Calza (variante experte)"
                hint="À son tour, un joueur peut annoncer « Calza » s'il pense que la mise est EXACTEMENT juste. S'il a raison, il récupère un dé ; sinon il en perd un."
                disabled={!isHost}
            />

            <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                Les 1 (Paco) sont des jokers et comptent pour n&apos;importe quelle face. Exception : pendant une
                manche « Palifico » (déclenchée quand un joueur tombe à 1 dé), les Paco ne sont plus jokers et la
                valeur de la mise est verrouillée — on ne peut plus que monter le nombre de dés.
            </p>
        </div>
    );
}
