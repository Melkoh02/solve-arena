export type TimerPrecision = 2 | 1;
export type TimeFormat = 'auto' | 'mm:ss.xx';
export type LayoutMode = 'auto' | 'mobile' | 'desktop';

export interface ShortcutBinding {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export type ShortcutId =
  | 'colorWhite'
  | 'colorYellow'
  | 'colorRed'
  | 'colorOrange'
  | 'colorBlue'
  | 'colorGreen'
  | 'deleteLastSolve'
  | 'clearAllSolves'
  | 'holdScramblePreview'
  | 'toggleScramblePreview'
  | 'toggleHistory';

export type ShortcutBindings = Record<ShortcutId, ShortcutBinding>;

export interface AppSettings {
  // Timer
  colorKeyHoldThreshold: number;
  spacebarRequiresHold: boolean;
  inspectionEnabled: boolean;
  inspectionDuration: number;

  // Display
  timerPrecision: TimerPrecision;
  timeFormat: TimeFormat;

  // Layout
  layoutMode: LayoutMode;

  // Shortcuts
  shortcuts: ShortcutBindings;
}

export const SHORTCUT_DEFAULTS: Readonly<ShortcutBindings> = Object.freeze({
  colorWhite: { key: 'w' },
  colorYellow: { key: 'y' },
  colorRed: { key: 'r' },
  colorOrange: { key: 'o' },
  colorBlue: { key: 'b' },
  colorGreen: { key: 'g' },
  deleteLastSolve: { key: 'Backspace' },
  clearAllSolves: { key: 'Backspace', ctrl: true, shift: true },
  holdScramblePreview: { key: 'e' },
  toggleScramblePreview: { key: 'e', ctrl: true },
  toggleHistory: { key: 'h' },
});

export const SETTINGS_DEFAULTS: Readonly<AppSettings> = Object.freeze({
  colorKeyHoldThreshold: 500,
  spacebarRequiresHold: false,
  inspectionEnabled: false,
  inspectionDuration: 15,
  timerPrecision: 2,
  timeFormat: 'auto',
  layoutMode: 'auto',
  shortcuts: SHORTCUT_DEFAULTS,
});
