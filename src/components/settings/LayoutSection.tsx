import { observer } from 'mobx-react-lite';
import {
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import LaptopIcon from '@mui/icons-material/Laptop';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../lib/hooks/useStore';
import type { LayoutMode } from '../../lib/constants/settingsDefaults';
import SectionResetButton from './SectionResetButton';
import {
  SETTINGS_LABEL_SX as LABEL_SX,
  SETTINGS_SECTION_HEADER_SX,
} from './styles';

const LayoutSection = observer(function LayoutSection() {
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
          {t('settings.layoutSection')}
        </Typography>
        <SectionResetButton
          visible={settingsStore.isLayoutModified}
          onClick={() => settingsStore.resetLayout()}
        />
      </Stack>

      <Typography sx={LABEL_SX}>{t('settings.layoutMode')}</Typography>
      <ToggleButtonGroup
        value={settingsStore.layoutMode}
        exclusive
        onChange={(_, val: LayoutMode | null) =>
          val !== null && settingsStore.setLayoutMode(val)
        }
        size="small">
        <ToggleButton
          value="auto"
          sx={{ textTransform: 'none', gap: 0.5, px: 2 }}>
          <AutoModeIcon sx={{ fontSize: 16 }} />
          {t('settings.layoutAuto')}
        </ToggleButton>
        <ToggleButton
          value="mobile"
          sx={{ textTransform: 'none', gap: 0.5, px: 2 }}>
          <SmartphoneIcon sx={{ fontSize: 16 }} />
          {t('settings.layoutMobile')}
        </ToggleButton>
        <ToggleButton
          value="desktop"
          sx={{ textTransform: 'none', gap: 0.5, px: 2 }}>
          <LaptopIcon sx={{ fontSize: 16 }} />
          {t('settings.layoutDesktop')}
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
});

export default LayoutSection;
