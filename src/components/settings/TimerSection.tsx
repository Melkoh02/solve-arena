import { observer } from 'mobx-react-lite';
import { Box, Slider, Stack, Switch, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../lib/hooks/useStore';
import SectionResetButton from './SectionResetButton';
import {
  SETTINGS_LABEL_SX as LABEL_SX,
  SETTINGS_SECTION_HEADER_SX,
} from './styles';

const TimerSection = observer(function TimerSection() {
  const { settingsStore } = useStore();
  const { t } = useTranslation();

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}>
        <Typography sx={SETTINGS_SECTION_HEADER_SX}>
          {t('settings.timerSection')}
        </Typography>
        <SectionResetButton
          visible={settingsStore.isTimerModified}
          onClick={() => settingsStore.resetTimer()}
        />
      </Stack>

      {/* Color key hold time */}
      <Typography sx={LABEL_SX}>{t('settings.colorKeyHoldTime')}</Typography>
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{ mb: 2.5, maxWidth: 350 }}>
        <Slider
          value={settingsStore.colorKeyHoldThreshold}
          onChange={(_, val) =>
            settingsStore.setColorKeyHoldThreshold(val as number)
          }
          min={100}
          max={2000}
          step={50}
          valueLabelDisplay="auto"
          valueLabelFormat={v => `${v}ms`}
          size="small"
        />
        <Typography
          sx={{
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            minWidth: 50,
            textAlign: 'right',
          }}>
          {settingsStore.colorKeyHoldThreshold}ms
        </Typography>
      </Stack>

      {/* Spacebar requires hold */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ maxWidth: 350, mb: 2 }}>
        <Typography sx={LABEL_SX}>
          {t('settings.spacebarRequiresHold')}
        </Typography>
        <Switch
          checked={settingsStore.spacebarRequiresHold}
          onChange={(_, checked) =>
            settingsStore.setSpacebarRequiresHold(checked)
          }
          size="small"
        />
      </Stack>

      {/* Inspection enabled */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ maxWidth: 350 }}>
        <Typography sx={LABEL_SX}>{t('settings.inspectionEnabled')}</Typography>
        <Switch
          checked={settingsStore.inspectionEnabled}
          onChange={(_, checked) => settingsStore.setInspectionEnabled(checked)}
          size="small"
        />
      </Stack>

      {/* Inspection duration (only shown when enabled) */}
      {settingsStore.inspectionEnabled && (
        <Box sx={{ mt: 1.5 }}>
          <Typography sx={LABEL_SX}>
            {t('settings.inspectionDuration')}
          </Typography>
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{ maxWidth: 350 }}>
            <Slider
              value={settingsStore.inspectionDuration}
              onChange={(_, val) =>
                settingsStore.setInspectionDuration(val as number)
              }
              min={5}
              max={60}
              step={1}
              valueLabelDisplay="auto"
              valueLabelFormat={v => `${v}s`}
              size="small"
            />
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                minWidth: 50,
                textAlign: 'right',
              }}>
              {settingsStore.inspectionDuration}s
            </Typography>
          </Stack>
        </Box>
      )}
    </Box>
  );
});

export default TimerSection;
