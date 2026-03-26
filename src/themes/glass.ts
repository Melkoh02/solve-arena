import { createTheme } from '@mui/material/styles';
import { sharedColors } from './sharedColors';

// ── Glass design tokens ──────────────────────────────────
const PRIMARY = '#FF69B4';
const TEXT_SECONDARY = '#a0a0c8';
const BLUR = '20px';
const BLUR_LIGHT = '12px';
const SURFACE_BG = 'rgba(255, 255, 255, 0.07)';
const SURFACE_BG_SOLID = 'rgba(20, 20, 50, 0.85)';
const BORDER = 'rgba(255, 255, 255, 0.13)';
const BORDER_ACCENT = 'rgba(255, 105, 180, 0.25)';
const RADIUS = 20;
const RADIUS_SM = 14;
const WALLPAPER = 'linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #1a1a4e 60%, #24243e 100%)';

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

// ── Theme ────────────────────────────────────────────────
export const glassTheme = createTheme({
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
    primary: { main: PRIMARY, dark: '#db5a9c', light: '#ff8cc8' },
    // Use a solid dark for background.paper so non-Paper elements using
    // bgcolor: 'background.paper' remain readable. The glassSurface
    // override on MuiPaper adds the translucency + blur.
    background: { default: '#0f0c29', paper: '#1a1a3e' },
    text: { primary: '#ffffffee', secondary: TEXT_SECONDARY },
    divider: 'rgba(255, 255, 255, 0.10)',
    success: { main: '#4caf50' },
    error: { main: '#f44336' },
  },
  shape: { borderRadius: RADIUS_SM },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    // ── Body wallpaper ──────────────────────────────────
    MuiCssBaseline: {
      styleOverrides: {
        // Use a fixed pseudo-element for the wallpaper so it doesn't
        // conflict with MUI's CssBaseline body styles.
        body: {
          backgroundColor: '#0f0c29',
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
            backgroundColor: 'rgba(255, 105, 180, 0.12)',
            '&:hover': {
              backgroundColor: 'rgba(255, 105, 180, 0.18)',
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
          background: 'rgba(255, 105, 180, 0.30)',
          color: '#fff',
          fontWeight: 700,
          letterSpacing: '0.04em',
          border: `1px solid ${BORDER_ACCENT}`,
          '&:hover': {
            background: 'rgba(255, 105, 180, 0.45)',
          },
          '&.Mui-disabled': {
            background: 'rgba(255, 105, 180, 0.10)',
            color: 'rgba(255, 105, 180, 0.35)',
          },
        },
        outlinedPrimary: {
          borderColor: BORDER_ACCENT,
          color: PRIMARY,
          '&:hover': {
            borderColor: PRIMARY,
            backgroundColor: 'rgba(255, 105, 180, 0.10)',
          },
        },
        outlinedError: {
          borderColor: 'rgba(244, 67, 54, 0.30)',
          '&:hover': {
            borderColor: '#f44336',
            backgroundColor: 'rgba(244, 67, 54, 0.10)',
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
          color: TEXT_SECONDARY,
          textTransform: 'none' as const,
          '&.Mui-selected': {
            backgroundColor: 'rgba(255, 105, 180, 0.18)',
            color: PRIMARY,
            '&:hover': {
              backgroundColor: 'rgba(255, 105, 180, 0.25)',
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
            color: TEXT_SECONDARY,
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
          color: TEXT_SECONDARY,
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
          backgroundColor: 'rgba(244, 67, 54, 0.12)',
          border: '1px solid rgba(244, 67, 54, 0.25)',
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
          backgroundColor: 'rgba(20, 20, 50, 0.85)',
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
