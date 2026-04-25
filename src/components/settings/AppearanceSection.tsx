import { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Autocomplete,
  Box,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../lib/hooks/useStore';
import { SUPPORTED_LANGUAGES } from '../../lib/constants/languages';
import { tokenKeysForScheme, type ThemeTokenKey } from '../../themes/tokens';
import SectionResetButton from './SectionResetButton';
import { SETTINGS_LABEL_SX as LABEL_SX } from './styles';

const AppearanceSection = observer(function AppearanceSection() {
  const { themeStore, languageStore } = useStore();
  const { t, i18n } = useTranslation();

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.id === i18n.language) ?? SUPPORTED_LANGUAGES[0];
  const tokens = themeStore.tokensFor(themeStore.scheme);

  return (
    <Box>
      {/* Theme */}
      <Typography sx={LABEL_SX}>{t('settings.theme')}</Typography>
      <ToggleButtonGroup
        value={themeStore.scheme}
        exclusive
        onChange={(_, val) => val && themeStore.setScheme(val)}
        size="small"
        sx={{ mb: 2 }}>
        <ToggleButton value="light" sx={{ textTransform: 'none', gap: 0.5, px: 2 }}>
          <LightModeIcon sx={{ fontSize: 16 }} />
          {t('settings.themeLight')}
        </ToggleButton>
        <ToggleButton value="dark" sx={{ textTransform: 'none', gap: 0.5, px: 2 }}>
          <DarkModeIcon sx={{ fontSize: 16 }} />
          {t('settings.themeDark')}
        </ToggleButton>
        <ToggleButton value="glass" sx={{ textTransform: 'none', gap: 0.5, px: 2 }}>
          <AutoAwesomeIcon sx={{ fontSize: 16 }} />
          {t('settings.themeGlass')}
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Accent colors for the active theme */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography sx={{ ...LABEL_SX, mb: 0 }}>{t('settings.colors')}</Typography>
        <SectionResetButton
          visible={themeStore.isPaletteModified(themeStore.scheme)}
          onClick={() => themeStore.resetPalette(themeStore.scheme)}
        />
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))',
          gap: 1,
          mb: 2.5,
        }}>
        {tokenKeysForScheme(themeStore.scheme).map(key => (
          <ColorSwatch
            key={key}
            label={t(`settings.color.${key}`)}
            value={normalizeForInput(tokens[key])}
            onChange={next =>
              themeStore.setColor(themeStore.scheme, key as ThemeTokenKey, next)
            }
          />
        ))}
      </Box>

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

interface ColorSwatchProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
}

function ColorSwatch({ label, value, onChange }: ColorSwatchProps) {
  // Coalesce rapid drag updates from <input type="color"> to one per frame.
  // Without this, every onInput tick rebuilds the MUI theme and reconciles the
  // entire tree, which the browser can't keep up with on color-picker drags.
  const pendingRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);

  const handleChange = (next: string) => {
    pendingRef.current = next;
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const v = pendingRef.current;
      pendingRef.current = null;
      if (v !== null) onChange(v);
    });
  };

  return (
    <Tooltip title={value.toUpperCase()} arrow>
      <Box
        component="label"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 0.75,
          py: 0.5,
          borderRadius: 1.25,
          cursor: 'pointer',
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.15s',
          '&:hover': {
            borderColor: 'primary.main',
          },
        }}>
        <Box
          sx={{
            width: 22,
            height: 22,
            borderRadius: 1,
            bgcolor: value,
            border: '1px solid rgba(0,0,0,0.25)',
            flexShrink: 0,
          }}
        />
        <Typography
          sx={{
            fontSize: '0.7rem',
            color: 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            minWidth: 0,
          }}>
          {label}
        </Typography>
        <Box
          component="input"
          type="color"
          value={value}
          onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleChange(e.target.value)
          }
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleChange(e.target.value)
          }
          sx={{
            position: 'absolute',
            width: 0,
            height: 0,
            opacity: 0,
            pointerEvents: 'none',
          }}
        />
      </Box>
    </Tooltip>
  );
}

/** <input type="color"> only accepts #rrggbb. Drop alpha and other formats. */
function normalizeForInput(value: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  if (/^#[0-9a-fA-F]{8}$/.test(value)) return value.slice(0, 7);
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const r = value[1], g = value[2], b = value[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return '#000000';
}

export default AppearanceSection;
