export const UNO_REWARDS: Record<number, number> = {
    1: 20,
    2: 13,
    3: 6,
};

export const UNO_DEFAULT_REWARD = 2;

export function computeUnoScore(rank: number): number {
    return UNO_REWARDS[rank] ?? UNO_DEFAULT_REWARD;
}
