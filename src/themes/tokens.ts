import type { Scheme } from '../lib/types/theme';

export interface ThemeTokens {
  primary: string;
  background: string;
  /** Second wallpaper stop for themes with a gradient (currently glass only). */
  backgroundAccent: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  success: string;
  error: string;
}

export type ThemeTokenKey = keyof ThemeTokens;

export const TOKEN_KEYS: ThemeTokenKey[] = [
  'primary',
  'background',
  'backgroundAccent',
  'surface',
  'textPrimary',
  'textSecondary',
  'success',
  'error',
];

/** Schemes with a wallpaper gradient — these render `backgroundAccent`. */
export const GRADIENT_SCHEMES: ReadonlySet<Scheme> = new Set([
  'glass',
] as Scheme[]);

/** Token keys to expose in the settings UI for a given scheme. */
export function tokenKeysForScheme(scheme: Scheme): ThemeTokenKey[] {
  if (GRADIENT_SCHEMES.has(scheme)) return TOKEN_KEYS;
  return TOKEN_KEYS.filter(k => k !== 'backgroundAccent');
}

export const DARK_TOKENS: Readonly<ThemeTokens> = Object.freeze({
  primary: '#FF69B4',
  background: '#0a0a14',
  backgroundAccent: '#0a0a14',
  surface: '#141428',
  textPrimary: '#ffffff',
  textSecondary: '#7a7a9e',
  success: '#4caf50',
  error: '#f44336',
});

export const LIGHT_TOKENS: Readonly<ThemeTokens> = Object.freeze({
  primary: '#db5a9c',
  background: '#f8f4f6',
  backgroundAccent: '#f8f4f6',
  surface: '#ffffff',
  textPrimary: '#1a1a28',
  textSecondary: '#5a5a78',
  success: '#28a745',
  error: '#f44336',
});

export const GLASS_TOKENS: Readonly<ThemeTokens> = Object.freeze({
  primary: '#FF69B4',
  background: '#0f0c29',
  backgroundAccent: '#302b63',
  surface: '#1a1a3e',
  textPrimary: '#ffffffee',
  textSecondary: '#a0a0c8',
  success: '#4caf50',
  error: '#f44336',
});

export const DEFAULT_TOKENS: Readonly<Record<Scheme, ThemeTokens>> =
  Object.freeze({
    light: LIGHT_TOKENS,
    dark: DARK_TOKENS,
    glass: GLASS_TOKENS,
  });
