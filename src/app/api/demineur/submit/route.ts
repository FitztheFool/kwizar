import { createSoloSubmitHandler } from '@/lib/soloSubmitHandler';

// Score = nombre de cases sûres révélées (max 71 en grille 9×9 / 10 mines).
// minDurationMs abaissé : une partie de démineur peut se gagner en quelques secondes.
export const POST = createSoloSubmitHandler({ gameType: 'DEMINEUR', maxScore: 71, minDurationMs: 3000 });
