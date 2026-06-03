import { createSoloSubmitHandler } from '@/lib/soloSubmitHandler';

export const POST = createSoloSubmitHandler({ gameType: 'TETRIS', maxScore: 9_999_999 });
