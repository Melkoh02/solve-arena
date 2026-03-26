import { observer } from 'mobx-react-lite';
import {
  Autocomplete,
  Box,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../lib/hooks/useStore';
import { SUPPORTED_LANGUAGES } from '../../lib/constants/languages';
import { SETTINGS_LABEL_SX as LABEL_SX } from './styles';

const AppearanceSection = observer(function AppearanceSection() {
  const { themeStore, languageStore } = useStore();
  const { t, i18n } = useTranslation();

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.id === i18n.language) ?? SUPPORTED_LANGUAGES[0];

  return (
    <Box>
      {/* Theme */}
      <Typography sx={LABEL_SX}>{t('settings.theme')}</Typography>
      <ToggleButtonGroup
        value={themeStore.scheme}
        exclusive
        onChange={(_, val) => val && themeStore.setScheme(val)}
        size="small"
        sx={{ mb: 2.5 }}>
        <ToggleButton value="light" sx={{ textTransform: 'none', gap: 0.5, px: 2 }}>
          <LightModeIcon sx={{ fontSize: 16 }} />
          {t('settings.themeLight')}
        </ToggleButton>
        <ToggleButton value="dark" sx={{ textTransform: 'none', gap: 0.5, px: 2 }}>
          <DarkModeIcon sx={{ fontSize: 16 }} />
          {t('settings.themeDark')}
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Language */}
      <Typography sx={LABEL_SX}>{t('settings.language')}</Typography>
      <Autocomplete
        value={currentLang}
        options={SUPPORTED_LANGUAGES}
        getOptionLabel={opt => t(opt.labelKey)}
        isOptionEqualToValue={(opt, val) => opt.id === val.id}
        onChange={(_, val) => val && languageStore.setLanguage(val.id)}
        disableClearable
        size="small"
        renderInput={params => (
          <TextField
            {...params}
            placeholder={t('settings.searchLanguage')}
            size="small"
          />
        )}
        sx={{ maxWidth: 300 }}
      />
    </Box>
  );
});

export default AppearanceSection;
