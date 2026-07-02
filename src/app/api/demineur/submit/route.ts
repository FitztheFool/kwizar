import { createSoloSubmitHandler } from '@/lib/soloSubmitHandler';
import { SAFE_CELLS } from '@/lib/demineur/engine';

// Score = nombre de cases sûres révélées (max SAFE_CELLS en grille 16×16 / 40 mines).
// minDurationMs abaissé : une partie de démineur peut se gagner en quelques secondes.
export const POST = createSoloSubmitHandler({ gameType: 'DEMINEUR', maxScore: SAFE_CELLS, minDurationMs: 3000 });
