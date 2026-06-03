import { createSoloSubmitHandler } from '@/lib/soloSubmitHandler';

export const POST = createSoloSubmitHandler({ gameType: 'PACMAN', maxScore: 1_000_000, hasRounds: true });
