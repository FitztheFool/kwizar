import { createSoloSubmitHandler } from '@/lib/soloSubmitHandler';

export const POST = createSoloSubmitHandler({ gameType: 'MATCH3', maxScore: 5_000_000 });
