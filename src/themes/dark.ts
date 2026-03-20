import { createTheme } from '@mui/material/styles';
import { sharedColors } from './sharedColors';

export const darkTheme = createTheme({
  scheme: 'dark',
  customColors: sharedColors,
  palette: {
    mode: 'dark',
    primary: { main: '#FF69B4', dark: '#db5a9c', light: '#ff8cc8' },
    background: { default: '#0a0a14', paper: '#141428' },
    text: { primary: '#ffffff', secondary: '#7a7a9e' },
    divider: 'rgba(255, 105, 180, 0.12)',
    success: { main: '#4caf50' },
    error: { main: '#f44336' },
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
          border: '1px solid rgba(255, 105, 180, 0.10)',
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: '#FF69B4',
          color: '#0a0a14',
          fontWeight: 700,
          letterSpacing: '0.04em',
          '&:hover': {
            background: '#ff8cc8',
          },
          '&.Mui-disabled': {
            background: 'rgba(255, 105, 180, 0.2)',
            color: 'rgba(255, 105, 180, 0.4)',
          },
        },
        outlinedPrimary: {
          borderColor: 'rgba(255, 105, 180, 0.35)',
          color: '#FF69B4',
          '&:hover': {
            borderColor: '#FF69B4',
            backgroundColor: 'rgba(255, 105, 180, 0.08)',
          },
        },
        outlinedError: {
          borderColor: 'rgba(244, 67, 54, 0.35)',
          '&:hover': {
            borderColor: '#f44336',
            backgroundColor: 'rgba(244, 67, 54, 0.08)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(255, 105, 180, 0.18)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 105, 180, 0.35)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#FF69B4',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#7a7a9e',
            '&.Mui-focused': {
              color: '#FF69B4',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 105, 180, 0.18)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 105, 180, 0.35)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#FF69B4',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        outlined: {
          borderColor: 'rgba(255, 105, 180, 0.25)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: 'rgba(255, 105, 180, 0.06)',
        },
        head: {
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontSize: '0.7rem',
          color: '#7a7a9e',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255, 105, 180, 0.12)',
          '&::before, &::after': {
            borderColor: 'rgba(255, 105, 180, 0.12)',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        standardError: {
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          border: '1px solid rgba(244, 67, 54, 0.2)',
        },
      },
    },
  },
});
