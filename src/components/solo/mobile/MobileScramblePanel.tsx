import { Box, ButtonBase, CircularProgress, Typography } from '@mui/material';
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

      <ButtonBase
        component="div"
        onClick={onOpenActions}
        aria-label={t('settings.scrambleActions')}
        sx={{
          mx: 1,
          px: 2,
          py: 1.5,
          width: 'calc(100% - 16px)',
          borderRadius: 2,
          bgcolor: isCustom
            ? 'rgba(255, 105, 180, 0.08)'
            : 'rgba(255, 105, 180, 0.04)',
          border: '1px solid',
          borderColor: isCustom ? 'primary.main' : 'divider',
          position: 'relative',
          textAlign: 'center',
          display: 'block',
          transition: 'background-color 0.15s, border-color 0.15s',
          '&:active, &:hover': {
            bgcolor: 'rgba(255, 105, 180, 0.12)',
          },
        }}>
        <Typography
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.95rem',
            letterSpacing: '0.06em',
            color: 'text.primary',
            lineHeight: 1.6,
            wordBreak: 'break-word',
            // Leave room for the decorative overflow icon at the right edge
            pr: 4,
          }}>
          {scramble}
        </Typography>

        {showPreview && scramble && (
          <ScramblePreview scramble={scramble} eventId={eventId} />
        )}

        {/* Decorative affordance — the whole pill is the click target */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            alignItems: 'center',
            color: 'text.secondary',
            pointerEvents: 'none',
          }}>
          <MoreVertIcon sx={{ fontSize: 22 }} />
        </Box>
      </ButtonBase>
    </Box>
  );
}
