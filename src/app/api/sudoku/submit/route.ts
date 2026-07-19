import { createSoloSubmitHandler } from '@/lib/soloSubmitHandler';
import { MAX_SCORE } from '@/lib/sudoku/engine';

// Score = cases justes × 10 × difficulté (+ bonus temps si la grille est résolue).
export const POST = createSoloSubmitHandler({ gameType: 'SUDOKU', maxScore: MAX_SCORE });
