import { createSoloSubmitHandler } from '@/lib/soloSubmitHandler';

export const POST = createSoloSubmitHandler({ gameType: 'BREAKOUT', maxScore: 1_000_000, hasRounds: true });
