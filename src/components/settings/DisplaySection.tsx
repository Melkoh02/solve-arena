import { observer } from 'mobx-react-lite';
import {
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../lib/hooks/useStore';
import SectionResetButton from './SectionResetButton';
import type { TimerPrecision, TimeFormat } from '../../lib/constants/settingsDefaults';

const LABEL_SX = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'text.secondary',
  mb: 0.75,
} as const;

const DisplaySection = observer(function DisplaySection() {
  const { settingsStore } = useStore();
  const { t } = useTranslation();

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary' }}>
          {t('settings.displaySection')}
        </Typography>
        <SectionResetButton
          visible={settingsStore.isDisplayModified}
          onClick={() => settingsStore.resetDisplay()}
        />
      </Stack>

      {/* Timer precision */}
      <Typography sx={LABEL_SX}>{t('settings.timerPrecision')}</Typography>
      <ToggleButtonGroup
        value={settingsStore.timerPrecision}
        exclusive
        onChange={(_, val: TimerPrecision | null) => val !== null && settingsStore.setTimerPrecision(val)}
        size="small"
        sx={{ mb: 2.5 }}>
        <ToggleButton value={2} sx={{ textTransform: 'none', fontFamily: 'monospace', px: 2 }}>
          0.00
        </ToggleButton>
        <ToggleButton value={1} sx={{ textTransform: 'none', fontFamily: 'monospace', px: 2 }}>
          0.0
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Time format for copy/export */}
      <Typography sx={LABEL_SX}>{t('settings.timeFormatExport')}</Typography>
      <ToggleButtonGroup
        value={settingsStore.timeFormat}
        exclusive
        onChange={(_, val: TimeFormat | null) => val !== null && settingsStore.setTimeFormat(val)}
        size="small">
        <ToggleButton value="auto" sx={{ textTransform: 'none', px: 2 }}>
          {t('settings.timeFormatAuto')}
        </ToggleButton>
        <ToggleButton value="mm:ss.xx" sx={{ textTransform: 'none', fontFamily: 'monospace', px: 2 }}>
          mm:ss.xx
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
});

export default DisplaySection;
