import type { SharedColors } from '../../themes/sharedColors.ts';

export type Scheme = 'light' | 'dark' | 'glass';

export interface GlassEffect {
  blur: string;
  surfaceBg: string;
  borderColor: string;
  wallpaper: string;
}

declare module '@mui/material/styles' {
  interface Theme {
    scheme: Scheme;
    customColors: SharedColors;
    glassEffect?: GlassEffect;
  }
  interface ThemeOptions {
    scheme?: Scheme;
    customColors?: Partial<SharedColors>;
    glassEffect?: GlassEffect;
  }
}

export type AppTheme = import('@mui/material/styles').Theme;
