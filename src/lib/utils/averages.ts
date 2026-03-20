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
 * Calculates a trimmed mean over the last `count` solves.
 *
 * @param solves   - Solves sorted newest-first.
 * @param count    - Window size (5 for ao5, 12 for ao12).
 * @param maxDnf   - Number of DNFs that makes the average DNF.
 *                   Also controls trimming: removes 1 best + (maxDnf-1) worst.
 *                   ao5: maxDnf=2 → trim 1 best + 1 worst, avg middle 3.
 *                   ao12: maxDnf=3 → trim 1 best + 2 worst, avg middle 9.
 */
export function calculateAverage(
  solves: SolveForAverage[],
  count: number,
  maxDnf: number,
): number | null {
  if (solves.length < count) return null;

  const recent = solves.slice(0, count);
  const times = recent.map(getEffectiveTime);

  const dnfCount = times.filter(t => !isFinite(t)).length;
  if (dnfCount >= maxDnf) return Infinity;

  const sorted = [...times].sort((a, b) => a - b);
  // Remove 1 best and (maxDnf - 1) worst
  const trimmed = sorted.slice(1, sorted.length - (maxDnf - 1));

  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

export function formatAverage(avg: number | null): string {
  if (avg === null) return '-';
  if (!isFinite(avg)) return 'DNF';
  return formatTime(avg);
}
