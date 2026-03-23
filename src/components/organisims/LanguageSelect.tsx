import { useState } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../lib/hooks/useStore';
import { SUPPORTED_LANGUAGES } from '../../lib/constants/languages';

export default function LanguageSelect() {
  const { languageStore } = useStore();
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <>
      <IconButton
        size="small"
        onClick={e => setAnchorEl(e.currentTarget)}
        title={t('modals.selectLanguageModal.title') || 'Language'}>
        <LanguageIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}>
        {SUPPORTED_LANGUAGES.map(opt => (
          <MenuItem
            key={opt.id}
            selected={i18n.language === opt.id}
            onClick={() => {
              languageStore.setLanguage(opt.id);
              setAnchorEl(null);
            }}>
            {t(opt.labelKey)}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
