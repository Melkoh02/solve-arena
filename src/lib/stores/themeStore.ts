import { action, makeAutoObservable, observable, runInAction } from 'mobx';
import { createLightTheme } from '../../themes/light';
import { createDarkTheme } from '../../themes/dark';
import { createGlassTheme } from '../../themes/glass';
import {
  DEFAULT_TOKENS,
  TOKEN_KEYS,
  type ThemeTokenKey,
  type ThemeTokens,
} from '../../themes/tokens';
import type { Scheme } from '../types/theme.ts';
import { PALETTE_KEY, THEME_KEY } from '../constants';

const SCHEME_ORDER: Scheme[] = ['light', 'dark', 'glass'];
const VALID_SCHEMES = new Set<string>(SCHEME_ORDER);

type PaletteOverrides = Record<Scheme, Partial<ThemeTokens>>;

const SAVE_DEBOUNCE_MS = 250;

export class ThemeStore {
  scheme: Scheme = 'dark';
  paletteOverrides: PaletteOverrides = { light: {}, dark: {}, glass: {} };
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    makeAutoObservable(this, {
      scheme: observable,
      paletteOverrides: observable,
      toggle: action.bound,
      setScheme: action.bound,
      setColor: action.bound,
      resetPalette: action.bound,
      theme: false,
      tokensFor: false,
      isPaletteModified: false,
    });
    this.loadScheme();
    this.loadPalette();
    try {
      const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
      mq?.addEventListener?.('change', e => {
        const saved = localStorage.getItem(THEME_KEY) as Scheme | null;
        if (!saved) this.setScheme(e.matches ? 'dark' : 'light');
      });
    } catch {}
  }

  setScheme(next: Scheme) {
    this.scheme = next;
    localStorage.setItem(THEME_KEY, next);
  }

  toggle() {
    const idx = SCHEME_ORDER.indexOf(this.scheme);
    this.setScheme(SCHEME_ORDER[(idx + 1) % SCHEME_ORDER.length]);
  }

  // ── Palette overrides ─────────────────────────────────

  setColor(scheme: Scheme, key: ThemeTokenKey, value: string) {
    this.paletteOverrides = {
      ...this.paletteOverrides,
      [scheme]: { ...this.paletteOverrides[scheme], [key]: value },
    };
    this.queueSave();
  }

  resetPalette(scheme: Scheme) {
    this.paletteOverrides = { ...this.paletteOverrides, [scheme]: {} };
    this.queueSave();
  }

  tokensFor(scheme: Scheme): ThemeTokens {
    return { ...DEFAULT_TOKENS[scheme], ...this.paletteOverrides[scheme] };
  }

  isPaletteModified(scheme: Scheme): boolean {
    const o = this.paletteOverrides[scheme];
    if (!o) return false;
    for (const key of TOKEN_KEYS) {
      if (o[key] !== undefined && o[key] !== DEFAULT_TOKENS[scheme][key]) {
        return true;
      }
    }
    return false;
  }

  get theme() {
    const tokens = this.tokensFor(this.scheme);
    if (this.scheme === 'glass') return createGlassTheme(tokens);
    return this.scheme === 'light'
      ? createLightTheme(tokens)
      : createDarkTheme(tokens);
  }

  // ── Persistence ───────────────────────────────────────

  private loadScheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved && VALID_SCHEMES.has(saved)) {
        runInAction(() => (this.scheme = saved as Scheme));
        return;
      }
      const prefersDark = window.matchMedia?.(
        '(prefers-color-scheme: dark)',
      )?.matches;
      runInAction(() => (this.scheme = prefersDark ? 'dark' : 'light'));
    } catch {
      // ignore
    }
  }

  private loadPalette() {
    try {
      const raw = localStorage.getItem(PALETTE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<PaletteOverrides>;
      const next: PaletteOverrides = { light: {}, dark: {}, glass: {} };
      for (const scheme of SCHEME_ORDER) {
        const entry = parsed[scheme];
        if (!entry || typeof entry !== 'object') continue;
        for (const key of TOKEN_KEYS) {
          const v = (entry as Partial<ThemeTokens>)[key];
          if (typeof v === 'string' && v.length > 0) {
            next[scheme][key] = v;
          }
        }
      }
      runInAction(() => (this.paletteOverrides = next));
    } catch {
      // ignore
    }
  }

  private queueSave() {
    if (this.saveTimer !== null) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.savePalette();
    }, SAVE_DEBOUNCE_MS);
  }

  private savePalette() {
    try {
      // Only persist non-empty overrides to keep storage tidy
      const empty = Object.values(this.paletteOverrides).every(
        o => Object.keys(o).length === 0,
      );
      if (empty) {
        localStorage.removeItem(PALETTE_KEY);
        return;
      }
      localStorage.setItem(PALETTE_KEY, JSON.stringify(this.paletteOverrides));
    } catch {
      // ignore
    }
  }
}
