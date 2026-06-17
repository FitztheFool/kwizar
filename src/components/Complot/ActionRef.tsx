'use client';

import {
    BanknotesIcon, GiftIcon, BoltIcon, AcademicCapIcon,
    ArrowsRightLeftIcon, ScaleIcon, FireIcon,
} from '@heroicons/react/24/solid';

/** Aide-mémoire des actions du tour (légende), look parchemin. À gauche du plateau. */
type Tag = { label: string; color: string };
const ROLE: Record<string, Tag> = {
    duc: { label: 'Duc', color: 'bg-purple-700' },
    capitaine: { label: 'Capitaine', color: 'bg-sky-700' },
    ambassadeur: { label: 'Ambassadeur', color: 'bg-emerald-700' },
    assassin: { label: 'Assassin', color: 'bg-zinc-800' },
    comtesse: { label: 'Comtesse', color: 'bg-rose-700' },
};

function Chip({ k }: { k: keyof typeof ROLE }) {
    const t = ROLE[k];
    return <span className={`inline-block align-middle mx-0.5 px-1.5 py-px rounded text-[9px] font-black uppercase tracking-wide text-white ${t.color}`}>{t.label}</span>;
}

type Icon = React.ComponentType<{ className?: string }>;
const ROWS: { icon: Icon; title: string; as?: string; desc: React.ReactNode }[] = [
    { icon: BanknotesIcon, title: 'Revenu', desc: <>Prends £1. Ne peut pas être bloqué.</> },
    { icon: GiftIcon, title: 'Aide étrangère', desc: <>Prends £2. <Chip k="duc" /> peut contrer.</> },
    { icon: BoltIcon, title: 'Assassinat', desc: <>Paie £7. Cible perd une influence. Ne peut pas être bloqué.</> },
    { icon: AcademicCapIcon, title: 'Taxe', as: 'en tant que', desc: <><Chip k="duc" /> · Prends £3. Ne peut pas être bloqué.</> },
    { icon: ScaleIcon, title: 'Voler', as: 'en tant que', desc: <><Chip k="capitaine" /> · Vole £2. <Chip k="capitaine" /> / <Chip k="ambassadeur" /> peut contrer.</> },
    { icon: ArrowsRightLeftIcon, title: 'Échange', as: 'en tant que', desc: <><Chip k="ambassadeur" /> · Échange 2 cartes avec le paquet.</> },
    { icon: FireIcon, title: 'Assassine', as: 'en tant que', desc: <><Chip k="assassin" /> · Paie £3, cible perd une influence. <Chip k="comtesse" /> peut contrer.</> },
];

export default function ComplotActionRef() {
    return (
        <aside className="w-full lg:w-72 shrink-0 order-last lg:order-none">
            <div className="lg:sticky lg:top-4 rounded-2xl border border-amber-900/30 bg-[#efe3c8] text-stone-800 shadow-lg px-4 py-3"
                style={{ backgroundImage: 'radial-gradient(rgba(120,90,40,0.05) 1px, transparent 1px)', backgroundSize: '6px 6px' }}>
                <h3 className="text-center text-[11px] font-black uppercase tracking-widest text-stone-700 mb-3 pb-1.5 border-b border-amber-900/20">
                    Actions lors de votre tour
                </h3>
                <ul className="space-y-2.5">
                    {ROWS.map(r => (
                        <li key={r.title} className="flex gap-2.5 items-start">
                            <r.icon className="w-4 h-4 mt-0.5 shrink-0 text-stone-600" />
                            <div className="text-[11px] leading-snug min-w-0">
                                <span className="font-black uppercase tracking-wide text-stone-900">{r.title}</span>
                                {r.as && <span className="italic text-stone-500"> {r.as}</span>}
                                <div className="text-stone-700">{r.desc}</div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    );
}
