import { alpha, createTheme, darken, lighten } from '@mui/material/styles';
import { sharedColors } from './sharedColors';
import { DARK_TOKENS, type ThemeTokens } from './tokens';

export function createDarkTheme(tokens: ThemeTokens = DARK_TOKENS) {
  const PRIMARY = tokens.primary;
  return createTheme({
    scheme: 'dark',
    customColors: sharedColors,
    palette: {
      mode: 'dark',
      primary: {
        main: PRIMARY,
        dark: darken(PRIMARY, 0.15),
        light: lighten(PRIMARY, 0.15),
      },
      background: { default: tokens.background, paper: tokens.surface },
      text: { primary: tokens.textPrimary, secondary: tokens.textSecondary },
      divider: alpha(PRIMARY, 0.12),
      success: { main: tokens.success },
      error: { main: tokens.error },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: `1px solid ${alpha(PRIMARY, 0.10)}`,
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          containedPrimary: {
            background: PRIMARY,
            color: tokens.background,
            fontWeight: 700,
            letterSpacing: '0.04em',
            '&:hover': {
              background: lighten(PRIMARY, 0.15),
            },
            '&.Mui-disabled': {
              background: alpha(PRIMARY, 0.2),
              color: alpha(PRIMARY, 0.4),
            },
          },
          outlinedPrimary: {
            borderColor: alpha(PRIMARY, 0.35),
            color: PRIMARY,
            '&:hover': {
              borderColor: PRIMARY,
              backgroundColor: alpha(PRIMARY, 0.08),
            },
          },
          outlinedError: {
            borderColor: alpha(tokens.error, 0.35),
            '&:hover': {
              borderColor: tokens.error,
              backgroundColor: alpha(tokens.error, 0.08),
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: alpha(PRIMARY, 0.18),
              },
              '&:hover fieldset': {
                borderColor: alpha(PRIMARY, 0.35),
              },
              '&.Mui-focused fieldset': {
                borderColor: PRIMARY,
              },
            },
            '& .MuiInputLabel-root': {
              color: tokens.textSecondary,
              '&.Mui-focused': {
                color: PRIMARY,
              },
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(PRIMARY, 0.18),
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(PRIMARY, 0.35),
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: PRIMARY,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          outlined: {
            borderColor: alpha(PRIMARY, 0.25),
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottomColor: alpha(PRIMARY, 0.06),
          },
          head: {
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontSize: '0.7rem',
            color: tokens.textSecondary,
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: alpha(PRIMARY, 0.12),
            '&::before, &::after': {
              borderColor: alpha(PRIMARY, 0.12),
            },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          standardError: {
            backgroundColor: alpha(tokens.error, 0.1),
            border: `1px solid ${alpha(tokens.error, 0.2)}`,
          },
        },
      },
    },
  });
}

export const darkTheme = createDarkTheme();
