import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import AppearanceSection from './AppearanceSection';
import TimerSection from './TimerSection';
import DisplaySection from './DisplaySection';
import ShortcutsSection from './ShortcutsSection';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            backgroundImage: 'none',
          },
        },
      }}>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: 700,
          fontSize: '1rem',
          pb: 0.5,
        }}>
        {t('settings.title')}
        <IconButton size="small" onClick={onClose} aria-label={t('common.cancel')} sx={{ color: 'text.secondary' }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 3 }}>
        {/* Appearance */}
        <Box sx={{ mb: 1 }}>
          <AppearanceSection />
        </Box>

        <Divider sx={{ my: 2.5 }} />

        {/* Timer */}
        <Box sx={{ mb: 1 }}>
          <TimerSection />
        </Box>

        <Divider sx={{ my: 2.5 }} />

        {/* Shortcuts */}
        <Box sx={{ mb: 1 }}>
          <ShortcutsSection />
        </Box>

        <Divider sx={{ my: 2.5 }} />

        {/* Display */}
        <DisplaySection />
      </DialogContent>
    </Dialog>
  );
}
