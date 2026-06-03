import { createSoloSubmitHandler } from '@/lib/soloSubmitHandler';

export const POST = createSoloSubmitHandler({ gameType: 'SNAKE', maxScore: 100_000 });
