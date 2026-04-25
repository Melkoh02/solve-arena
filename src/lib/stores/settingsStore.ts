import { makeAutoObservable } from 'mobx';
import { SETTINGS_KEY } from '../constants';
import {
  SETTINGS_DEFAULTS,
  SHORTCUT_DEFAULTS,
  type AppSettings,
  type LayoutMode,
  type ShortcutBinding,
  type ShortcutBindings,
  type ShortcutId,
  type TimerPrecision,
  type TimeFormat,
} from '../constants/settingsDefaults';
import { shortcutsEqual } from '../utils/shortcuts';

export class SettingsStore {
  colorKeyHoldThreshold: number = SETTINGS_DEFAULTS.colorKeyHoldThreshold;
  spacebarRequiresHold: boolean = SETTINGS_DEFAULTS.spacebarRequiresHold;
  timerPrecision: TimerPrecision = SETTINGS_DEFAULTS.timerPrecision;
  timeFormat: TimeFormat = SETTINGS_DEFAULTS.timeFormat;
  layoutMode: LayoutMode = SETTINGS_DEFAULTS.layoutMode;
  shortcuts: ShortcutBindings = cloneShortcuts(SHORTCUT_DEFAULTS);

  constructor() {
    makeAutoObservable(this);
    this.loadFromStorage();
  }

  // ── Timer setters ─────────────────────────────────────

  setColorKeyHoldThreshold(ms: number) {
    this.colorKeyHoldThreshold = Math.max(100, Math.min(2000, Math.round(ms)));
    this.saveToStorage();
  }

  setSpacebarRequiresHold(value: boolean) {
    this.spacebarRequiresHold = value;
    this.saveToStorage();
  }

  // ── Display setters ───────────────────────────────────

  setTimerPrecision(value: TimerPrecision) {
    this.timerPrecision = value;
    this.saveToStorage();
  }

  setTimeFormat(value: TimeFormat) {
    this.timeFormat = value;
    this.saveToStorage();
  }

  // ── Layout setters ────────────────────────────────────

  setLayoutMode(value: LayoutMode) {
    this.layoutMode = value;
    this.saveToStorage();
  }

  // ── Shortcuts ─────────────────────────────────────────

  setShortcut(id: ShortcutId, binding: ShortcutBinding) {
    this.shortcuts = { ...this.shortcuts, [id]: normalizeBinding(binding) };
    this.saveToStorage();
  }

  // ── Section reset ─────────────────────────────────────

  get isTimerModified(): boolean {
    return (
      this.colorKeyHoldThreshold !== SETTINGS_DEFAULTS.colorKeyHoldThreshold ||
      this.spacebarRequiresHold !== SETTINGS_DEFAULTS.spacebarRequiresHold
    );
  }

  get isDisplayModified(): boolean {
    return (
      this.timerPrecision !== SETTINGS_DEFAULTS.timerPrecision ||
      this.timeFormat !== SETTINGS_DEFAULTS.timeFormat
    );
  }

  get isLayoutModified(): boolean {
    return this.layoutMode !== SETTINGS_DEFAULTS.layoutMode;
  }

  get isShortcutsModified(): boolean {
    for (const id of Object.keys(SHORTCUT_DEFAULTS) as ShortcutId[]) {
      if (!shortcutsEqual(this.shortcuts[id], SHORTCUT_DEFAULTS[id])) return true;
    }
    return false;
  }

  resetTimer() {
    this.colorKeyHoldThreshold = SETTINGS_DEFAULTS.colorKeyHoldThreshold;
    this.spacebarRequiresHold = SETTINGS_DEFAULTS.spacebarRequiresHold;
    this.saveToStorage();
  }

  resetDisplay() {
    this.timerPrecision = SETTINGS_DEFAULTS.timerPrecision;
    this.timeFormat = SETTINGS_DEFAULTS.timeFormat;
    this.saveToStorage();
  }

  resetLayout() {
    this.layoutMode = SETTINGS_DEFAULTS.layoutMode;
    this.saveToStorage();
  }

  resetShortcuts() {
    this.shortcuts = cloneShortcuts(SHORTCUT_DEFAULTS);
    this.saveToStorage();
  }

  // ── Persistence ───────────────────────────────────────

  private saveToStorage() {
    try {
      const data: AppSettings = {
        colorKeyHoldThreshold: this.colorKeyHoldThreshold,
        spacebarRequiresHold: this.spacebarRequiresHold,
        timerPrecision: this.timerPrecision,
        timeFormat: this.timeFormat,
        layoutMode: this.layoutMode,
        shortcuts: this.shortcuts,
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as Partial<AppSettings>;

      if (typeof data.colorKeyHoldThreshold === 'number') {
        this.colorKeyHoldThreshold = Math.max(100, Math.min(2000, data.colorKeyHoldThreshold));
      }
      if (typeof data.spacebarRequiresHold === 'boolean') {
        this.spacebarRequiresHold = data.spacebarRequiresHold;
      }
      if (data.timerPrecision === 1 || data.timerPrecision === 2) {
        this.timerPrecision = data.timerPrecision;
      }
      if (data.timeFormat === 'auto' || data.timeFormat === 'mm:ss.xx') {
        this.timeFormat = data.timeFormat;
      }
      if (
        data.layoutMode === 'auto' ||
        data.layoutMode === 'mobile' ||
        data.layoutMode === 'desktop'
      ) {
        this.layoutMode = data.layoutMode;
      }
      if (data.shortcuts && typeof data.shortcuts === 'object') {
        const next = cloneShortcuts(SHORTCUT_DEFAULTS);
        for (const id of Object.keys(SHORTCUT_DEFAULTS) as ShortcutId[]) {
          const stored = (data.shortcuts as Partial<ShortcutBindings>)[id];
          if (stored && typeof stored.key === 'string' && stored.key.length > 0) {
            next[id] = normalizeBinding(stored);
          }
        }
        this.shortcuts = next;
      }
    } catch {
      // ignore
    }
  }
}

function cloneShortcuts(src: ShortcutBindings): ShortcutBindings {
  const out = {} as ShortcutBindings;
  for (const id of Object.keys(src) as ShortcutId[]) {
    out[id] = { ...src[id] };
  }
  return out;
}

function normalizeBinding(b: ShortcutBinding): ShortcutBinding {
  const out: ShortcutBinding = {
    key: b.key.length === 1 ? b.key.toLowerCase() : b.key,
  };
  if (b.ctrl) out.ctrl = true;
  if (b.shift) out.shift = true;
  if (b.alt) out.alt = true;
  return out;
}
