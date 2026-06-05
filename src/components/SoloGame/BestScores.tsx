import { TrophyIcon, GlobeAltIcon } from '@heroicons/react/24/solid';
import StatCell from './StatCell';

// Splits the old single "MEILLEUR" stat into two cells: the player's personal
// best ("MOI") and the all-time leaderboard top ("GLOBAL"). Rendered as a
// fragment so it drops straight into a solo game's stats grid.
export default function BestScores({ me, global }: { me: number; global: number }) {
    // The global record includes everyone — the player included — so it can never
    // be below their own best. (A local best not yet submitted may exceed the
    // server's leaderboard top.)
    const globalValue = Math.max(me, global);
    return (
        <>
            <StatCell
                icon={<TrophyIcon className="w-3 h-3 text-yellow-500" />}
                label="MOI"
                value={me}
                color="text-yellow-500 dark:text-yellow-400"
            />
            <StatCell
                icon={<GlobeAltIcon className="w-3 h-3 text-sky-500" />}
                label="GLOBAL"
                value={globalValue}
                color="text-sky-600 dark:text-sky-400"
            />
        </>
    );
}
