import type { Solve } from '../types/timer';

export function formatTime(ms: number): string {
  if (ms === 0) return '0.00';

  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}:${seconds.toFixed(2).padStart(5, '0')}`;
  }

  return seconds.toFixed(2);
}

export function getDisplayTime(solve: Pick<Solve, 'time' | 'penalty'>): string {
  if (solve.penalty === 'DNF') return 'DNF';
  const time = solve.penalty === '+2' ? solve.time + 2000 : solve.time;
  const formatted = formatTime(time);
  return solve.penalty === '+2' ? `${formatted}+` : formatted;
}
