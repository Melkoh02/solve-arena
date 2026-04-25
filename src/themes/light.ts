import { createTheme } from '@mui/material/styles';
import { sharedColors } from './sharedColors';
import { LIGHT_TOKENS, type ThemeTokens } from './tokens';

export function createLightTheme(tokens: ThemeTokens = LIGHT_TOKENS) {
  return createTheme({
    scheme: 'light',
    customColors: sharedColors,
    palette: {
      mode: 'light',
      primary: { main: tokens.primary },
      background: { default: tokens.background, paper: tokens.surface },
      text: { primary: tokens.textPrimary, secondary: tokens.textSecondary },
      success: { main: tokens.success },
      error: { main: tokens.error },
    },
    components: {
      MuiPaper: { styleOverrides: { root: { borderRadius: 12 } } },
    },
  });
}

export const lightTheme = createLightTheme();
