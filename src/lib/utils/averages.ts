import type { Penalty } from '../types/timer';
import { formatTime } from './formatTime';

interface SolveForAverage {
  time: number;
  penalty: Penalty;
}

export function getEffectiveTime(solve: SolveForAverage): number {
  if (solve.penalty === 'DNF') return Infinity;
  return solve.penalty === '+2' ? solve.time + 2000 : solve.time;
}

/**
 * Calculates a trimmed mean (remove best and worst) over the last `count` solves.
 * Returns null if not enough solves, Infinity if more than 1 DNF in the window.
 */
export function calculateAverage(
  solves: SolveForAverage[],
  count: number,
): number | null {
  if (solves.length < count) return null;

  const recent = solves.slice(0, count);
  const times = recent.map(getEffectiveTime);

  const dnfCount = times.filter(t => t === Infinity).length;
  if (dnfCount > 1) return Infinity;

  const sorted = [...times].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, -1);

  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

export function formatAverage(avg: number | null): string {
  if (avg === null) return '-';
  if (!isFinite(avg)) return 'DNF';
  return formatTime(avg);
}
