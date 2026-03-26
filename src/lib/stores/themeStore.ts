import { action, makeAutoObservable, observable, runInAction } from 'mobx';
import { lightTheme } from '../../themes/light';
import { darkTheme } from '../../themes/dark';
import { glassTheme } from '../../themes/glass';
import type { Scheme } from '../types/theme.ts';
import { THEME_KEY } from '../constants';

const SCHEME_ORDER: Scheme[] = ['light', 'dark', 'glass'];
const VALID_SCHEMES = new Set<string>(SCHEME_ORDER);

export class ThemeStore {
  scheme: Scheme = 'dark';

  constructor() {
    makeAutoObservable(this, {
      scheme: observable,
      toggle: action.bound,
      setScheme: action.bound,
      theme: false,
    });
    this.loadScheme();
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

  get theme() {
    if (this.scheme === 'glass') return glassTheme;
    return this.scheme === 'light' ? lightTheme : darkTheme;
  }

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
}
