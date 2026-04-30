import {
  Box,
  ButtonBase,
  CircularProgress,
  IconButton,
  Typography,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useTranslation } from 'react-i18next';
import ScramblePreview from '../../timer/ScramblePreview';

export interface MobileScramblePanelProps {
  scramble: string;
  eventId: string;
  isLoading: boolean;
  isCustom: boolean;
  showPreview: boolean;
  onOpenActions: () => void;
  /** Solo-only prev/next nav. Pass both or neither — multiplayer hides
   * these because the server controls the scramble. */
  onPrevScramble?: () => void;
  onNextScramble?: () => void;
  canPrevScramble?: boolean;
  canNextScramble?: boolean;
}

export default function MobileScramblePanel({
  scramble,
  eventId,
  isLoading,
  isCustom,
  showPreview,
  onOpenActions,
  onPrevScramble,
  onNextScramble,
  canPrevScramble = false,
  canNextScramble = false,
}: MobileScramblePanelProps) {
  const { t } = useTranslation();
  const showNav = !!onPrevScramble && !!onNextScramble;

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
      {isCustom && (
        <Typography
          sx={{
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontSize: '0.6rem',
            fontWeight: 700,
            color: 'primary.main',
            mb: 0.5,
          }}>
          {t('timer.customScramble')}
        </Typography>
      )}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 0.5,
          mx: 1,
        }}>
        {showNav && (
          <IconButton
            size="small"
            onClick={onPrevScramble}
            disabled={!canPrevScramble}
            aria-label={t('timer.prevScramble')}
            sx={{
              flexShrink: 0,
              alignSelf: 'center',
              color: 'text.secondary',
              opacity: canPrevScramble ? 0.8 : 0.25,
            }}>
            <ChevronLeftIcon sx={{ fontSize: 22 }} />
          </IconButton>
        )}
        <ButtonBase
          component="div"
          onClick={onOpenActions}
          aria-label={t('settings.scrambleActions')}
          sx={{
            flex: 1,
            px: 2,
            py: 1.5,
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
        {showNav && (
          <IconButton
            size="small"
            onClick={onNextScramble}
            disabled={!canNextScramble}
            aria-label={t('timer.nextScramble')}
            sx={{
              flexShrink: 0,
              alignSelf: 'center',
              color: 'text.secondary',
              opacity: canNextScramble ? 0.8 : 0.25,
            }}>
            <ChevronRightIcon sx={{ fontSize: 22 }} />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}
