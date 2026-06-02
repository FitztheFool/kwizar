// Human-readable date/time formatting for chat & conversations (French locale).

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

function startOfDay(d: Date): number {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
}

/** Whole calendar days between two dates (0 = same day, 1 = yesterday). */
function calendarDaysAgo(d: Date, now: Date): number {
    return Math.round((startOfDay(now) - startOfDay(d)) / DAY);
}

/**
 * Compact relative label for conversation lists.
 * "à l'instant" · "5 min" · "3 h" · "hier" · "lun." · "12/03" · "12/03/24".
 */
export function formatRelativeShort(input: string | number | Date, now: Date = new Date()): string {
    const d = new Date(input);
    const diff = now.getTime() - d.getTime();
    if (diff < MIN) return "à l'instant";
    if (diff < HOUR) return `${Math.floor(diff / MIN)} min`;
    const days = calendarDaysAgo(d, now);
    if (days === 0) return `${Math.floor(diff / HOUR)} h`;
    if (days === 1) return 'hier';
    if (days < 7) return d.toLocaleDateString('fr-FR', { weekday: 'short' });
    if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

/**
 * Per-message timestamp with clock time.
 * "14:32" (today) · "hier 14:32" · "lun. 14:32" · "12/03 14:32" · "12/03/24 14:32".
 */
export function formatMessageTime(input: string | number | Date, now: Date = new Date()): string {
    const d = new Date(input);
    const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const days = calendarDaysAgo(d, now);
    if (days === 0) return time;
    if (days === 1) return `hier ${time}`;
    if (days < 7) return `${d.toLocaleDateString('fr-FR', { weekday: 'short' })} ${time}`;
    if (d.getFullYear() === now.getFullYear()) return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} ${time}`;
    return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })} ${time}`;
}
