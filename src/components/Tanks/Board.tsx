'use client';

import { useEffect, useRef, useState } from 'react';
import type { TanksGameState, ShotEvent } from '@/hooks/useTanks';

const W = 900, H = 500;
const COLORS = ['#2563eb', '#dc2626'];       // tank 0 bleu, tank 1 rouge

interface Props {
    state: TanksGameState;
    myColorIndex: 0 | 1 | null;
    isMyTurn: boolean;
    shot: ShotEvent | null;
    onClearShot: () => void;
    onFire: (angle: number, power: number, weaponId: string) => void;
}

export default function TanksBoard({ state, myColorIndex, isMyTurn, shot, onClearShot, onFire }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [angle, setAngle] = useState(45);
    const [power, setPower] = useState(55);
    const [weaponId, setWeaponId] = useState('shell');
    const animRef = useRef<number | null>(null);
    const [firing, setFiring] = useState(false);

    // angle d'orientation du canon pour mon tank (0° = droite). Si je suis à droite, on vise vers la gauche.
    const myBarrelAngle = (ci: 0 | 1) => (ci === 1 ? 180 - angle : angle);

    function draw(projectile?: { x: number; y: number } | null, flash?: { x: number; y: number; r: number } | null) {
        const cv = canvasRef.current; if (!cv) return;
        const ctx = cv.getContext('2d'); if (!ctx) return;
        ctx.clearRect(0, 0, W, H);

        // ciel
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#1e3a5f'); sky.addColorStop(1, '#3b6ea5');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

        // terrain
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let x = 0; x < state.terrain.length; x++) ctx.lineTo(x, state.terrain[x]);
        ctx.lineTo(W, H); ctx.closePath();
        const ground = ctx.createLinearGradient(0, H * 0.4, 0, H);
        ground.addColorStop(0, '#5b7c3a'); ground.addColorStop(1, '#3a2e1f');
        ctx.fillStyle = ground; ctx.fill();

        // tanks
        state.tanks.forEach((t, i) => {
            ctx.save();
            ctx.translate(t.x, t.y);
            // corps
            ctx.fillStyle = COLORS[i];
            ctx.beginPath(); ctx.moveTo(-13, 0); ctx.lineTo(13, 0); ctx.lineTo(10, -8); ctx.lineTo(-10, -8); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.arc(0, -8, 6, Math.PI, 2 * Math.PI); ctx.fill();
            // canon (oriente selon l'angle du tireur courant)
            const ba = (state.currentTurn === i ? myBarrelAngle(i as 0 | 1) : (i === 1 ? 135 : 45)) * Math.PI / 180;
            ctx.strokeStyle = '#222'; ctx.lineWidth = 4; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(Math.cos(ba) * 20, -11 - Math.sin(ba) * 20); ctx.stroke();
            ctx.restore();

            // barre de vie
            ctx.fillStyle = '#0008'; ctx.fillRect(t.x - 16, t.y - 30, 32, 5);
            ctx.fillStyle = t.hp > 40 ? '#22c55e' : t.hp > 15 ? '#f59e0b' : '#ef4444';
            ctx.fillRect(t.x - 16, t.y - 30, 32 * (t.hp / 100), 5);
        });

        // projectile
        if (projectile) {
            ctx.fillStyle = '#fde047';
            ctx.beginPath(); ctx.arc(projectile.x, projectile.y, 4, 0, 2 * Math.PI); ctx.fill();
        }
        // explosion
        if (flash) {
            ctx.fillStyle = 'rgba(255,140,0,0.8)';
            ctx.beginPath(); ctx.arc(flash.x, flash.y, flash.r, 0, 2 * Math.PI); ctx.fill();
            ctx.fillStyle = 'rgba(255,230,120,0.9)';
            ctx.beginPath(); ctx.arc(flash.x, flash.y, flash.r * 0.5, 0, 2 * Math.PI); ctx.fill();
        }
    }

    // redessine quand l'état ou la visée change (hors animation)
    useEffect(() => { if (!firing) draw(); });

    // animation du tir reçu
    useEffect(() => {
        if (!shot) return;
        setFiring(true);
        const traj = shot.trajectory;
        const total = traj.length;
        const perFrame = Math.max(1, Math.ceil(total / 110));   // ~1.8s : obus bien visible
        let i = 0;
        const tick = () => {
            i += perFrame;
            if (i >= total) {
                // explosion finale
                const imp = shot.impact;
                if (imp) {
                    let r = 4;
                    const boom = () => {
                        draw(null, { x: imp.x, y: imp.y, r });
                        r += 4;
                        if (r < 40) { animRef.current = requestAnimationFrame(boom); }
                        else { setFiring(false); onClearShot(); }
                    };
                    boom();
                } else { setFiring(false); onClearShot(); }
                return;
            }
            draw(traj[i]);
            animRef.current = requestAnimationFrame(tick);
        };
        animRef.current = requestAnimationFrame(tick);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shot]);

    const canFire = isMyTurn && !firing && state.phase === 'playing';

    return (
        <div className="w-full max-w-3xl flex flex-col gap-3">
            <canvas
                ref={canvasRef}
                width={W} height={H}
                className="w-full rounded-xl ring-1 ring-black/20 shadow-lg"
                style={{ aspectRatio: `${W}/${H}`, imageRendering: 'auto' }}
            />

            {/* Vent */}
            <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Vent</span>
                <span className="font-mono font-bold">{state.wind === 0 ? '0' : `${Math.abs(state.wind)}`}</span>
                <span className="text-lg leading-none">{state.wind > 0 ? '➡️' : state.wind < 0 ? '⬅️' : '·'}</span>
            </div>

            {/* Contrôles */}
            <div className={`grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end p-3 rounded-xl bg-black/5 dark:bg-white/5 ${canFire ? '' : 'opacity-50 pointer-events-none'}`}>
                <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Angle : <b className="text-gray-900 dark:text-white">{angle}°</b>
                    <input type="range" min={0} max={180} value={angle} onChange={e => setAngle(Number(e.target.value))} className="accent-lime-600" />
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Puissance : <b className="text-gray-900 dark:text-white">{power}</b>
                    <input type="range" min={5} max={100} value={power} onChange={e => setPower(Number(e.target.value))} className="accent-lime-600" />
                </label>
                <div className="flex flex-col gap-1.5">
                    <select value={weaponId} onChange={e => setWeaponId(e.target.value)}
                        className="text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-gray-900 dark:text-white">
                        {state.weapons.map(w => (
                            <option key={w.id} value={w.id} className="bg-white dark:bg-gray-800">
                                {w.name} — rayon {w.radius}, dégâts {w.damage}
                            </option>
                        ))}
                    </select>
                    {(() => { const w = state.weapons.find(x => x.id === weaponId); return w ? (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">
                            Plus le rayon est grand, plus c&apos;est facile de toucher ; plus les dégâts sont élevés, plus ça fait mal.
                        </span>
                    ) : null; })()}
                    <button
                        onClick={() => { if (canFire) onFire(myBarrelAngle(myColorIndex ?? 0), power, weaponId); }}
                        disabled={!canFire}
                        className="px-5 py-2 rounded-lg bg-lime-600 hover:bg-lime-500 text-white font-bold text-sm active:scale-95 transition disabled:opacity-50">
                        🔥 Feu
                    </button>
                </div>
            </div>
        </div>
    );
}
