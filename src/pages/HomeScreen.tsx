import {
  Box,
  Button,
  FormControlLabel,
  Stack,
  Switch,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useStore } from '../lib/hooks/useStore';
import { useTheme } from '../lib/hooks/useTheme';
import LanguageSelect from '../components/organisims/LanguageSelect.tsx';
import PuzzleSelector from '../components/timer/PuzzleSelector.tsx';
import ScrambleDisplay from '../components/timer/ScrambleDisplay.tsx';
import Timer from '../components/timer/Timer.tsx';
import SolveHistory from '../components/timer/SolveHistory.tsx';

export default function HomeScreen() {
  const { userStore, themeStore } = useStore();
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        p: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <PuzzleSelector />

        <Stack direction="row" spacing={1.5} alignItems="center">
          <FormControlLabel
            sx={{ m: 0 }}
            control={
              <Switch
                checked={theme.scheme === 'dark'}
                onChange={themeStore.toggle}
              />
            }
            label={t('settings.toggleTheme')}
          />
          <LanguageSelect />
          <Button
            variant="contained"
            color="primary"
            onClick={() => userStore.logout()}
          >
            {t('settings.logout')}
          </Button>
        </Stack>
      </Box>

      <ScrambleDisplay />
      <Timer />

      <Box sx={{ flex: 1, overflow: 'auto', mt: 2 }}>
        <SolveHistory />
      </Box>
    </Box>
  );
}
