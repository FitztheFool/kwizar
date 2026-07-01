// src/components/GameCombobox.tsx
// Combobox de jeux UNIQUE et partagé (saisie + dropdown d'autocomplétion collé sous le champ,
// par-dessus la bordure). Chaque page fournit ses `options` (clé/label/gameType) et son
// comportement via `onSelect` :
//   - classement / stats / profil : single-select (value + displaySelected + trailing "check")
//   - accueil / admin#games        : filtre live (query contrôlée par le parent)
//   - admin#trending               : ajout multi (trailing "plus", options = jeux restants)
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import GameIcon from '@/components/GameIcon';
import { RectangleGroupIcon, ChevronUpDownIcon, MagnifyingGlassIcon, XMarkIcon, CheckIcon, PlusIcon } from '@heroicons/react/24/outline';

export interface GameOption {
    key: string;
    label: string;
    /** Pour l'icône ; à défaut on retombe sur `key` (GameIcon accepte les deux). */
    gameType?: string;
}

/** Normalise pour une recherche insensible aux accents/casse. */
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

interface Props {
    options: GameOption[];
    onSelect: (key: string) => void;
    /** Clé sélectionnée (single-select). Peut valoir `allKey`. */
    value?: string | null;
    /** Recherche contrôlée par le parent (filtre live accueil / admin#games). */
    query?: string;
    onQueryChange?: (q: string) => void;
    showAll?: boolean;
    allKey?: string;
    optionTrailing?: 'plus' | 'check' | 'none';
    /** Affiche le label sélectionné dans le champ quand il est fermé (single-select). */
    displaySelected?: boolean;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    menuClassName?: string;
    optionHoverClassName?: string;
    emptyLabel?: string;
}

const BASE_INPUT = 'w-full pl-9 pr-9 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400';
const BASE_MENU = 'rounded-b-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900';
const BASE_OPTION_HOVER = 'hover:bg-gray-50 dark:hover:bg-gray-800/60';

export default function GameCombobox({
    options, onSelect, value, query, onQueryChange,
    showAll = false, allKey = 'ALL', optionTrailing = 'none',
    displaySelected = false, placeholder = 'Rechercher un jeu…',
    className = 'w-full max-w-xs', inputClassName, menuClassName, optionHoverClassName,
    emptyLabel = 'Aucun jeu trouvé',
}: Props) {
    const controlled = onQueryChange !== undefined;
    const [innerQuery, setInnerQuery] = useState('');
    const q = controlled ? (query ?? '') : innerQuery;
    const setQ = (v: string) => { if (controlled) onQueryChange!(v); else setInnerQuery(v); };

    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLUListElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Position du menu (rendu en portal pour échapper aux ancêtres `overflow-hidden`).
    const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null);
    const updateRect = useCallback(() => {
        const el = rootRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        setMenuRect({ top: r.bottom, left: r.left, width: r.width });
    }, []);

    useEffect(() => {
        if (!open) return;
        updateRect();
        window.addEventListener('scroll', updateRect, true);
        window.addEventListener('resize', updateRect);
        return () => { window.removeEventListener('scroll', updateRect, true); window.removeEventListener('resize', updateRect); };
    }, [open, updateRect]);

    // Fermer sur clic extérieur (champ + menu portalisé) + Échap.
    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            const t = e.target as Node;
            if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return;
            setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
    }, [open]);

    useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

    const selected = displaySelected && value && value !== allKey ? options.find(o => o.key === value) ?? null : null;
    const selectedLabel = value === allKey ? (showAll ? 'Tous les jeux' : '') : (selected?.label ?? '');
    const fieldValue = open ? q : (displaySelected ? selectedLabel : q);
    const filtered = q ? options.filter(o => norm(o.label).includes(norm(q))) : options;

    const choose = (key: string) => {
        onSelect(key);
        setOpen(false);
        if (!controlled) setInnerQuery('');
    };

    const trailingFor = (key: string) => {
        if (optionTrailing === 'plus') return <PlusIcon className="w-4 h-4 shrink-0 text-gray-400" />;
        if (optionTrailing === 'check' && value === key) return <CheckIcon className="w-4 h-4 shrink-0 text-red-500" />;
        return null;
    };

    const hover = optionHoverClassName ?? BASE_OPTION_HOVER;

    return (
        <div ref={rootRef} className={`relative ${className}`}>
            <div className="relative">
                {selected
                    ? <span className="absolute inset-y-0 left-3 my-auto flex items-center pointer-events-none"><GameIcon gameType={selected.gameType ?? selected.key} className="w-4 h-4 rounded" /></span>
                    : <MagnifyingGlassIcon className="absolute inset-y-0 left-3 my-auto w-4 h-4 text-gray-400 pointer-events-none" />}
                <input
                    ref={inputRef}
                    type="text"
                    value={fieldValue}
                    onChange={e => { setQ(e.target.value); setOpen(true); }}
                    onFocus={() => { if (displaySelected && !controlled) setInnerQuery(''); setOpen(true); }}
                    placeholder={placeholder}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    className={`${inputClassName ?? BASE_INPUT} ${open ? 'rounded-b-none' : ''}`}
                />
                <span className="absolute inset-y-0 right-2 my-auto flex items-center">
                    {q
                        ? <button type="button" onClick={() => { setQ(''); inputRef.current?.focus(); }} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" title="Effacer"><XMarkIcon className="w-4 h-4" /></button>
                        : <ChevronUpDownIcon className="w-4 h-4 text-gray-400" />}
                </span>
            </div>

            {open && menuRect && typeof document !== 'undefined' && createPortal(
                <ul ref={menuRef} role="listbox" style={{ position: 'fixed', top: menuRect.top, left: menuRect.left, width: menuRect.width }} className={`z-50 -mt-px max-h-72 overflow-y-auto shadow-xl py-1 ${menuClassName ?? BASE_MENU}`}>
                    {showAll && !q && (
                        <Option
                            icon={<RectangleGroupIcon className="w-5 h-5" />}
                            label="Tous les jeux"
                            trailing={optionTrailing === 'check' && value === allKey ? <CheckIcon className="w-4 h-4 shrink-0 text-red-500" /> : null}
                            active={value === allKey}
                            hover={hover}
                            onClick={() => choose(allKey)}
                        />
                    )}
                    {filtered.map(o => (
                        <Option
                            key={o.key}
                            icon={<GameIcon gameType={o.gameType ?? o.key} className="w-5 h-5 rounded" />}
                            label={o.label}
                            trailing={trailingFor(o.key)}
                            active={optionTrailing === 'check' && value === o.key}
                            hover={hover}
                            onClick={() => choose(o.key)}
                        />
                    ))}
                    {filtered.length === 0 && (
                        <li className="px-3 py-2 text-sm text-gray-400 text-center">{emptyLabel}</li>
                    )}
                </ul>,
                document.body
            )}
        </div>
    );
}

function Option({ icon, label, trailing, active, hover, onClick }: {
    icon: React.ReactNode; label: string; trailing: React.ReactNode; active: boolean; hover: string; onClick: () => void;
}) {
    return (
        <li>
            <button
                type="button"
                role="option"
                aria-selected={active}
                onClick={onClick}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${active ? 'bg-gray-100 dark:bg-gray-800 font-semibold text-gray-900 dark:text-white' : `text-gray-700 dark:text-gray-300 ${hover}`}`}
            >
                <span className="shrink-0 text-gray-500 dark:text-gray-400">{icon}</span>
                <span className="flex-1 truncate">{label}</span>
                {trailing}
            </button>
        </li>
    );
}
