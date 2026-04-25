import { Box, CircularProgress, IconButton, Typography } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useTranslation } from 'react-i18next';
import ScramblePreview from '../../timer/ScramblePreview';

export interface MobileScramblePanelProps {
  scramble: string;
  eventId: string;
  isLoading: boolean;
  isCustom: boolean;
  showPreview: boolean;
  onOpenActions: () => void;
}

export default function MobileScramblePanel({
  scramble,
  eventId,
  isLoading,
  isCustom,
  showPreview,
  onOpenActions,
}: MobileScramblePanelProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 80,
          mb: 1,
        }}>
        <CircularProgress size={20} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 1, textAlign: 'center', position: 'relative' }}>
      <Typography
        sx={{
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          fontSize: '0.6rem',
          fontWeight: 700,
          color: isCustom ? 'primary.main' : 'text.secondary',
          mb: 0.5,
        }}>
        {isCustom ? t('timer.customScramble') : t('timer.scrambleLabel')}
      </Typography>

      <Box
        sx={{
          mx: 1,
          px: 2,
          py: 1.5,
          borderRadius: 2,
          bgcolor: isCustom
            ? 'rgba(255, 105, 180, 0.08)'
            : 'rgba(255, 105, 180, 0.04)',
          border: '1px solid',
          borderColor: isCustom ? 'primary.main' : 'divider',
          position: 'relative',
        }}>
        <Typography
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.95rem',
            letterSpacing: '0.06em',
            color: 'text.primary',
            lineHeight: 1.6,
            wordBreak: 'break-word',
            // Leave room for the absolute-positioned overflow button
            pr: 4,
          }}>
          {scramble}
        </Typography>

        {showPreview && scramble && (
          <ScramblePreview scramble={scramble} eventId={eventId} />
        )}

        <IconButton
          size="medium"
          onClick={onOpenActions}
          aria-label={t('settings.scrambleActions')}
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            color: 'text.secondary',
          }}>
          <MoreVertIcon sx={{ fontSize: 22 }} />
        </IconButton>
      </Box>
    </Box>
  );
}
