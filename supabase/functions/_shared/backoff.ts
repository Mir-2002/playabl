const FLOOR = 180   // seconds (3 min base interval)
const CAP   = 3600  // seconds (60 min maximum)

/**
 * Compute the next poll interval in seconds given how many consecutive empty
 * polls have occurred. Doubles on each empty poll (exponential backoff), capped
 * at CAP, then applies ±15% jitter via the injected rng.
 *
 * Pass consecutiveEmptyPolls=0 (after a tick with new scrobbles) to reset to
 * the floor interval.
 */
export function computeNextInterval(
  consecutiveEmptyPolls: number,
  rng: () => number,
): number {
  const base = Math.min(FLOOR * Math.pow(2, consecutiveEmptyPolls), CAP)
  const jitter = 1 + (rng() * 2 - 1) * 0.15
  return Math.round(base * jitter)
}
