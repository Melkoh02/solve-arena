import type { Solve } from '../types/timer';
import type { TimerPrecision, TimeFormat } from '../constants/settingsDefaults';

export function formatTime(ms: number, precision: TimerPrecision = 2): string {
  if (ms === 0) return precision === 2 ? '0.00' : '0.0';

  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    const padWidth = precision === 2 ? 5 : 4;
    return `${minutes}:${seconds.toFixed(precision).padStart(padWidth, '0')}`;
  }

  return seconds.toFixed(precision);
}

export function formatTimeForExport(
  ms: number,
  precision: TimerPrecision = 2,
  timeFormat: TimeFormat = 'auto',
): string {
  if (timeFormat === 'auto') return formatTime(ms, precision);

  // Force mm:ss.xx format
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const padWidth = precision === 2 ? 5 : 4;
  return `${minutes}:${seconds.toFixed(precision).padStart(padWidth, '0')}`;
}

export function getDisplayTime(
  solve: Pick<Solve, 'time' | 'penalty'>,
  precision: TimerPrecision = 2,
): string {
  if (solve.penalty === 'DNF') return 'DNF';
  const time = solve.penalty === '+2' ? solve.time + 2000 : solve.time;
  const formatted = formatTime(time, precision);
  return solve.penalty === '+2' ? `${formatted}+` : formatted;
}
