import { createTheme } from '@mui/material/styles';
import { sharedColors } from './sharedColors';

export const lightTheme = createTheme({
  scheme: 'light',
  customColors: sharedColors,
  palette: {
    mode: 'light',
    primary: { main: '#db5a9c' },
    background: { default: '#f8f4f6', paper: '#ffffff' },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { borderRadius: 12 } } },
  },
});
