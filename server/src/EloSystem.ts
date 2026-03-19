/**
 * EloSystem -- Standard ELO rating calculator.
 *
 * K-factor: 32
 * Minimum ELO: 100
 */

const K_FACTOR = 32;
const MIN_ELO = 100;

export interface EloResult {
  winnerNewElo: number;
  loserNewElo: number;
  winnerDelta: number;
  loserDelta: number;
}

/**
 * Calculate new ELO ratings after a match.
 */
export function calculateNewRatings(winnerElo: number, loserElo: number): EloResult {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoser = 1 - expectedWinner;

  const winnerDelta = Math.round(K_FACTOR * (1 - expectedWinner));
  const loserDelta = Math.round(K_FACTOR * (0 - expectedLoser));

  const winnerNewElo = Math.max(MIN_ELO, winnerElo + winnerDelta);
  const loserNewElo = Math.max(MIN_ELO, loserElo + loserDelta);

  return {
    winnerNewElo,
    loserNewElo,
    winnerDelta,
    loserDelta,
  };
}
