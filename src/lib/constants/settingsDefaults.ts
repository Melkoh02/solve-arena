export type TimerPrecision = 2 | 1;
export type TimeFormat = 'auto' | 'mm:ss.xx';

export interface AppSettings {
  // Timer
  colorKeyHoldThreshold: number;
  spacebarRequiresHold: boolean;

  // Display
  timerPrecision: TimerPrecision;
  timeFormat: TimeFormat;
}

export const SETTINGS_DEFAULTS: Readonly<AppSettings> = Object.freeze({
  colorKeyHoldThreshold: 500,
  spacebarRequiresHold: false,
  timerPrecision: 2,
  timeFormat: 'auto',
});
