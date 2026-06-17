'use client';

import type { MBPlayerView, BattleTop } from '@/hooks/useMilleBornes';
import { isBot } from '@/hooks/useMilleBornes';
import { SAFETY_LABEL, SAFETY_DESC } from './labels';
import AfkCountdown from '@/components/AfkCountdown';
import { ShieldCheckIcon, BoltIcon } from '@heroicons/react/24/solid';
import {
    TruckIcon, HandRaisedIcon, ExclamationTriangleIcon, WrenchScrewdriverIcon,
    FlagIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, LifebuoyIcon,
    Battery0Icon, Battery100Icon,
} from '@heroicons/react/24/outline';

type IconCmp = React.ComponentType<{ className?: string }>;

interface Props {
    player: MBPlayerView;
    target: number;
    isCurrent: boolean;
    isMe: boolean;
    targetable?: boolean;
    targetMode?: 'attack' | 'help';
    onTarget?: () => void;
    inactivityEndsAt?: number | null;
}

const TEAM_LABEL: Record<0 | 1, string> = { 0: 'Ambre', 1: 'Verte' };
const TEAM_DOT: Record<0 | 1, string> = { 0: 'bg-primary-500', 1: 'bg-felt-600' };

type Tone = 'go' | 'stop' | 'warn' | 'idle';
const TONE_CARD: Record<Tone, string> = {
    go: 'bg-emerald-500 border-emerald-700 text-white',
    stop: 'bg-red-500 border-red-700 text-white',
    warn: 'bg-amber-400 border-amber-600 text-amber-950',
    idle: 'bg-zinc-200 dark:bg-zinc-700 border-zinc-400 dark:border-zinc-600 text-zinc-500 dark:text-zinc-300',
};

/** Carte de pile (bataille / vitesse) façon plateau. */
function PileCard({ Icon, label, tone, title }: { Icon: IconCmp; label: string; tone: Tone; title?: string }) {
    return (
        <div title={title} className={`w-[58px] h-[78px] rounded-lg border-2 shadow-md flex flex-col items-center justify-center gap-1 select-none ${TONE_CARD[tone]}`}>
            <Icon className="w-7 h-7" />
            <span className="text-[9px] font-black uppercase tracking-tight text-center leading-tight px-0.5">{label}</span>
        </div>
    );
}

/** État de la pile bataille → carte. */
function battleCard(p: MBPlayerView): { Icon: IconCmp; label: string; tone: Tone } {
    if (p.finished) return { Icon: FlagIcon, label: 'Arrivé', tone: 'go' };
    const bt: BattleTop = p.battleTop;
    if (bt === 'stop') return { Icon: HandRaisedIcon, label: 'Feu rouge', tone: 'stop' };
    if (bt === 'accident') return { Icon: ExclamationTriangleIcon, label: 'Accident', tone: 'stop' };
    if (bt === 'outOfGas') return { Icon: Battery0Icon, label: 'Panne', tone: 'stop' };
    if (bt === 'flatTire') return { Icon: LifebuoyIcon, label: 'Crevaison', tone: 'stop' };
    if (p.canRoll) return { Icon: TruckIcon, label: 'Roule', tone: 'go' };
    if (bt === 'repairs') return { Icon: WrenchScrewdriverIcon, label: 'Réparé', tone: 'warn' };
    if (bt === 'gas') return { Icon: Battery100Icon, label: 'Essence', tone: 'warn' };
    if (bt === 'spareTire') return { Icon: LifebuoyIcon, label: 'Roue', tone: 'warn' };
    return { Icon: TruckIcon, label: 'Feu vert ?', tone: 'warn' };  // soigné mais pas encore reparti
}

export default function PlayerBoard({ player, target, isCurrent, isMe, targetable, targetMode = 'attack', onTarget, inactivityEndsAt }: Props) {
    const pct = Math.min(100, Math.round((player.distance / target) * 100));
    const Wrapper: React.ElementType = targetable ? 'button' : 'div';
    const battle = battleCard(player);
    const speed: { Icon: IconCmp; label: string; tone: Tone } = player.finished
        ? { Icon: FlagIcon, label: 'Fini', tone: 'idle' }
        : player.speedLimited
            ? { Icon: ArrowTrendingDownIcon, label: 'Limité 50', tone: 'warn' }
            : { Icon: ArrowTrendingUpIcon, label: 'Libre', tone: 'go' };

    return (
        <Wrapper
            {...(targetable ? { type: 'button', onClick: onTarget } : {})}
            className={`relative wood-tile rounded-xl px-3 py-2.5 text-left w-full transition-all
                ${!player.alive ? 'opacity-40 grayscale' : ''}
                ${isCurrent && player.alive ? 'ring-4 ring-yellow-300/80' : ''}
                ${isMe ? 'ring-2 ring-sky-400/70' : ''}
                ${targetable ? `cursor-pointer ring-4 animate-pulse hover:-translate-y-0.5 hover:animate-none ${targetMode === 'help' ? 'ring-emerald-500 hover:ring-emerald-400' : 'ring-red-500 hover:ring-red-400'}` : ''}`}
        >
            {targetable && (
                <span className={`absolute -top-2 -right-2 z-10 inline-flex items-center gap-0.5 text-[10px] font-black text-white rounded-full px-2 py-0.5 shadow-lg ${targetMode === 'help' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                    {targetMode === 'help' ? 'Soigner' : 'Attaquer'}
                </span>
            )}

            {/* En-tête */}
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-1.5 font-extrabold text-gray-900 min-w-0">
                    <span className="truncate">{player.username}{isMe && ' (vous)'}</span>
                    {player.team != null && (
                        <span title={`Équipe ${TEAM_LABEL[player.team]}`} className="inline-flex items-center gap-1 text-[9px] font-bold text-gray-700 bg-white/70 rounded-full px-1.5 py-0.5">
                            <span className={`w-2 h-2 rounded-full ${TEAM_DOT[player.team]}`} />{TEAM_LABEL[player.team]}
                        </span>
                    )}
                    {isBot(player) && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-indigo-600 text-white leading-none shadow-sm">BOT</span>
                    )}
                </div>
                {!player.alive ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-700/90 text-white shrink-0">
                        {player.exitReason === 'abandon' ? 'Abandon' : player.exitReason === 'afk' ? 'AFK' : 'Hors course'}
                    </span>
                ) : inactivityEndsAt != null ? <AfkCountdown endsAt={inactivityEndsAt} /> : null}
            </div>

            {/* Piles bataille + vitesse + distance */}
            <div className="flex items-stretch gap-2">
                <div className="flex flex-col items-center gap-1">
                    <PileCard Icon={battle.Icon} label={battle.label} tone={battle.tone} title="Pile bataille" />
                    <span className="text-[8px] font-bold uppercase tracking-wide text-gray-700/80">Bataille</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <PileCard Icon={speed.Icon} label={speed.label} tone={speed.tone} title="Limite de vitesse" />
                    <span className="text-[8px] font-bold uppercase tracking-wide text-gray-700/80">Vitesse</span>
                </div>

                <div className="flex-1 flex flex-col justify-center min-w-0">
                    <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-xl font-black text-gray-900">{player.distance}</span>
                        <span className="text-[10px] text-gray-600">/ {target} km</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-black/15 overflow-hidden mt-1">
                        <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-600 font-semibold mt-1">{player.handCount} carte{player.handCount > 1 ? 's' : ''}</span>
                </div>
            </div>

            {/* Bottes (cartes) + coups fourrés */}
            <div className="flex items-center gap-1 mt-2 flex-wrap min-h-[20px]">
                {player.safeties.map(s => (
                    <span key={s} title={SAFETY_DESC[s]} className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-900 bg-amber-200 border border-amber-400 rounded px-1.5 py-1 cursor-help shadow-sm">
                        <ShieldCheckIcon className="w-3 h-3" />
                        {SAFETY_LABEL[s]}
                    </span>
                ))}
                {player.coupsFourres > 0 && (
                    <span title="Coups fourrés réussis : botte jouée juste après l'attaque correspondante (+300 pts chacun)." className="inline-flex items-center gap-0.5 text-[9px] font-bold text-purple-900 bg-purple-200 border border-purple-400 rounded px-1.5 py-1 cursor-help shadow-sm">
                        <BoltIcon className="w-3 h-3" /> ×{player.coupsFourres}
                    </span>
                )}
                {player.safeties.length === 0 && player.coupsFourres === 0 && (
                    <span className="text-[9px] text-gray-600/70 italic">Aucune botte</span>
                )}
            </div>
        </Wrapper>
    );
}
