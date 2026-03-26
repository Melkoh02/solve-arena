import { makeAutoObservable } from 'mobx';
import { SETTINGS_KEY } from '../constants';
import {
  SETTINGS_DEFAULTS,
  type AppSettings,
  type TimerPrecision,
  type TimeFormat,
} from '../constants/settingsDefaults';

export class SettingsStore {
  colorKeyHoldThreshold: number = SETTINGS_DEFAULTS.colorKeyHoldThreshold;
  spacebarRequiresHold: boolean = SETTINGS_DEFAULTS.spacebarRequiresHold;
  timerPrecision: TimerPrecision = SETTINGS_DEFAULTS.timerPrecision;
  timeFormat: TimeFormat = SETTINGS_DEFAULTS.timeFormat;

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

  // ── Persistence ───────────────────────────────────────

  private saveToStorage() {
    try {
      const data: AppSettings = {
        colorKeyHoldThreshold: this.colorKeyHoldThreshold,
        spacebarRequiresHold: this.spacebarRequiresHold,
        timerPrecision: this.timerPrecision,
        timeFormat: this.timeFormat,
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
    } catch {
      // ignore
    }
  }
}
