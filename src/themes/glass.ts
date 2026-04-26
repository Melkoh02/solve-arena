import { alpha, createTheme, darken, lighten } from '@mui/material/styles';
import { sharedColors } from './sharedColors';
import { GLASS_TOKENS, type ThemeTokens } from './tokens';

const BLUR = '20px';
const BLUR_LIGHT = '12px';
const SURFACE_BG = 'rgba(255, 255, 255, 0.07)';
const BORDER = 'rgba(255, 255, 255, 0.13)';
const RADIUS = 20;
const RADIUS_SM = 14;

export function createGlassTheme(tokens: ThemeTokens = GLASS_TOKENS) {
  const PRIMARY = tokens.primary;
  const BORDER_ACCENT = alpha(PRIMARY, 0.25);
  const SURFACE_BG_SOLID = alpha(tokens.surface, 0.85);
  // Two-tone diagonal — matches the original prod purple gradient when both
  // tokens are at their defaults. Setting bg == bgAccent yields a flat fill.
  const WALLPAPER = `linear-gradient(135deg, ${tokens.background} 0%, ${tokens.backgroundAccent} 50%, ${tokens.background} 100%)`;

  const glassSurface = {
    backdropFilter: `blur(${BLUR})`,
    WebkitBackdropFilter: `blur(${BLUR})`,
    backgroundColor: SURFACE_BG,
    border: `1px solid ${BORDER}`,
    backgroundImage: 'none',
    '@supports not (backdrop-filter: blur(1px))': {
      backgroundColor: SURFACE_BG_SOLID,
    },
  } as const;

  return createTheme({
    scheme: 'glass',
    customColors: sharedColors,
    glassEffect: {
      blur: BLUR,
      surfaceBg: SURFACE_BG,
      borderColor: BORDER,
      wallpaper: WALLPAPER,
    },
    palette: {
      mode: 'dark',
      primary: {
        main: PRIMARY,
        dark: darken(PRIMARY, 0.15),
        light: lighten(PRIMARY, 0.15),
      },
      // Use a solid dark for background.paper so non-Paper elements using
      // bgcolor: 'background.paper' remain readable. The glassSurface
      // override on MuiPaper adds the translucency + blur.
      background: { default: tokens.background, paper: tokens.surface },
      text: { primary: tokens.textPrimary, secondary: tokens.textSecondary },
      divider: 'rgba(255, 255, 255, 0.10)',
      success: { main: tokens.success },
      error: { main: tokens.error },
    },
    shape: { borderRadius: RADIUS_SM },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    components: {
      // ── Body wallpaper ──────────────────────────────────
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: tokens.background,
          },
          'body::before': {
            content: '""',
            position: 'fixed',
            inset: 0,
            zIndex: -1,
            background: WALLPAPER,
            backgroundAttachment: 'fixed',
          },
        },
      },

      // ── Surfaces ────────────────────────────────────────
      MuiPaper: {
        styleOverrides: {
          root: {
            ...glassSurface,
            borderRadius: RADIUS,
          },
        },
      },

      MuiDialog: {
        styleOverrides: {
          paper: {
            ...glassSurface,
            backdropFilter: `blur(${BLUR_LIGHT})`,
            WebkitBackdropFilter: `blur(${BLUR_LIGHT})`,
            borderRadius: RADIUS + 4,
          },
        },
      },

      MuiBackdrop: {
        styleOverrides: {
          root: {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          },
        },
      },

      MuiPopover: {
        styleOverrides: {
          paper: {
            ...glassSurface,
            borderRadius: RADIUS_SM,
          },
        },
      },

      MuiMenu: {
        styleOverrides: {
          paper: {
            ...glassSurface,
            borderRadius: RADIUS_SM,
          },
        },
      },

      MuiMenuItem: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            },
            '&.Mui-selected': {
              backgroundColor: alpha(PRIMARY, 0.12),
              '&:hover': {
                backgroundColor: alpha(PRIMARY, 0.18),
              },
            },
          },
        },
      },

      // ── Buttons ─────────────────────────────────────────
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: RADIUS_SM,
            textTransform: 'none' as const,
          },
          containedPrimary: {
            background: alpha(PRIMARY, 0.3),
            color: '#fff',
            fontWeight: 700,
            letterSpacing: '0.04em',
            border: `1px solid ${BORDER_ACCENT}`,
            '&:hover': {
              background: alpha(PRIMARY, 0.45),
            },
            '&.Mui-disabled': {
              background: alpha(PRIMARY, 0.1),
              color: alpha(PRIMARY, 0.35),
            },
          },
          outlinedPrimary: {
            borderColor: BORDER_ACCENT,
            color: PRIMARY,
            '&:hover': {
              borderColor: PRIMARY,
              backgroundColor: alpha(PRIMARY, 0.1),
            },
          },
          outlinedError: {
            borderColor: alpha(tokens.error, 0.3),
            '&:hover': {
              borderColor: tokens.error,
              backgroundColor: alpha(tokens.error, 0.1),
            },
          },
        },
      },

      MuiButtonGroup: {
        styleOverrides: {
          root: {
            borderRadius: RADIUS_SM,
            '& .MuiButton-root': {
              borderColor: BORDER,
            },
          },
        },
      },

      MuiToggleButtonGroup: {
        styleOverrides: {
          root: {
            borderRadius: RADIUS_SM,
            ...glassSurface,
            padding: '4px',
            gap: '4px',
          },
        },
      },

      MuiToggleButton: {
        styleOverrides: {
          root: {
            borderRadius: `${RADIUS_SM - 2}px !important`,
            border: 'none !important',
            color: tokens.textSecondary,
            textTransform: 'none' as const,
            '&.Mui-selected': {
              backgroundColor: alpha(PRIMARY, 0.18),
              color: PRIMARY,
              '&:hover': {
                backgroundColor: alpha(PRIMARY, 0.25),
              },
            },
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
            },
          },
        },
      },

      MuiIconButton: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            },
          },
        },
      },

      // ── Inputs ──────────────────────────────────────────
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: RADIUS_SM,
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              '& fieldset': {
                borderColor: BORDER,
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.25)',
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
            borderRadius: RADIUS_SM,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: BORDER,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.25)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: PRIMARY,
            },
          },
        },
      },

      MuiAutocomplete: {
        styleOverrides: {
          paper: {
            ...glassSurface,
            borderRadius: RADIUS_SM,
          },
        },
      },

      // ── Data display ────────────────────────────────────
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottomColor: 'rgba(255, 255, 255, 0.06)',
            backgroundColor: 'transparent',
          },
          head: {
            fontWeight: 700,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.06em',
            fontSize: '0.7rem',
            color: tokens.textSecondary,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
        },
      },

      MuiTableContainer: {
        styleOverrides: {
          root: {
            backgroundColor: 'transparent',
          },
        },
      },

      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: 'rgba(255, 255, 255, 0.10)',
            '&::before, &::after': {
              borderColor: 'rgba(255, 255, 255, 0.10)',
            },
          },
        },
      },

      MuiChip: {
        styleOverrides: {
          outlined: {
            borderColor: BORDER,
          },
        },
      },

      MuiAlert: {
        styleOverrides: {
          standardError: {
            ...glassSurface,
            backgroundColor: alpha(tokens.error, 0.12),
            border: `1px solid ${alpha(tokens.error, 0.25)}`,
          },
        },
      },

      // ── Feedback ────────────────────────────────────────
      MuiSnackbarContent: {
        styleOverrides: {
          root: {
            ...glassSurface,
            borderRadius: RADIUS_SM,
          },
        },
      },

      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backdropFilter: `blur(${BLUR_LIGHT})`,
            WebkitBackdropFilter: `blur(${BLUR_LIGHT})`,
            backgroundColor: SURFACE_BG_SOLID,
            border: `1px solid ${BORDER}`,
            borderRadius: 8,
          },
        },
      },

      MuiSwitch: {
        styleOverrides: {
          track: {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
          },
        },
      },

      MuiSlider: {
        styleOverrides: {
          track: {
            backgroundColor: PRIMARY,
          },
          rail: {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
          },
        },
      },
    },
  });
}

export const glassTheme = createGlassTheme();
