'use client';

/** Aide-mémoire des actions du tour (légende). Affiché à gauche du plateau. */
type Tag = { label: string; color: string };
const ROLE: Record<string, Tag> = {
    duc: { label: 'Duc', color: 'bg-purple-600' },
    capitaine: { label: 'Capitaine', color: 'bg-sky-600' },
    ambassadeur: { label: 'Ambassadeur', color: 'bg-emerald-600' },
    assassin: { label: 'Assassin', color: 'bg-zinc-800' },
    comtesse: { label: 'Comtesse', color: 'bg-rose-600' },
};

function Chip({ k }: { k: keyof typeof ROLE }) {
    const t = ROLE[k];
    return <span className={`inline-block align-middle px-1.5 py-0.5 rounded text-[9px] font-black uppercase text-white ${t.color}`}>{t.label}</span>;
}

const ROWS: { title: string; desc: React.ReactNode }[] = [
    { title: 'Revenu', desc: <>Prends £1. Ne peut pas être bloqué.</> },
    { title: 'Aide étrangère', desc: <>Prends £2. <Chip k="duc" /> peut contrer.</> },
    { title: 'Coup', desc: <>Paie £7. Cible perd une influence. Ne peut pas être bloqué.</> },
    { title: 'Taxe', desc: <>En tant que <Chip k="duc" /> : prends £3.</> },
    { title: 'Voler', desc: <>En tant que <Chip k="capitaine" /> : vole £2. <Chip k="capitaine" /> / <Chip k="ambassadeur" /> peut contrer.</> },
    { title: 'Échanger', desc: <>En tant que <Chip k="ambassadeur" /> : échange 2 cartes avec le paquet.</> },
    { title: 'Assassiner', desc: <>En tant que <Chip k="assassin" /> : paie £3, cible perd une influence. <Chip k="comtesse" /> peut contrer.</> },
];

export default function ComplotActionRef() {
    return (
        <aside className="w-full lg:w-72 shrink-0 order-last lg:order-none">
            <div className="lg:sticky lg:top-4 bg-black/30 backdrop-blur rounded-2xl px-4 py-3">
                <h3 className="text-[10px] uppercase tracking-widest text-gray-300 font-bold mb-2">Actions du tour</h3>
                <ul className="space-y-2">
                    {ROWS.map(r => (
                        <li key={r.title} className="text-xs leading-snug">
                            <span className="font-black text-amber-300">{r.title}</span>
                            <span className="text-gray-300"> — {r.desc}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    );
}
