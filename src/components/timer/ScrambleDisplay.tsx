import { useState } from 'react';
import { Box, CircularProgress, IconButton, Typography } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useTranslation } from 'react-i18next';
import ScramblePreview from './ScramblePreview';

const PREVIEW_KEY = 'scramblePreviewVisible';

interface ScrambleDisplayProps {
  scramble: string;
  eventId?: string;
  isLoading?: boolean;
}

export default function ScrambleDisplay({
  scramble,
  eventId = '333',
  isLoading = false,
}: ScrambleDisplayProps) {
  const { t } = useTranslation();
  const [showPreview, setShowPreview] = useState(() => {
    try {
      return localStorage.getItem(PREVIEW_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const togglePreview = () => {
    setShowPreview(prev => {
      const next = !prev;
      try {
        localStorage.setItem(PREVIEW_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={20} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ textAlign: 'center', mb: 2, maxWidth: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
          mb: 1,
        }}>
        <Typography
          sx={{
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontSize: '0.6rem',
            fontWeight: 700,
            color: 'text.secondary',
          }}>
          {t('timer.scrambleLabel')}
        </Typography>
        <IconButton
          size="small"
          onClick={togglePreview}
          sx={{
            p: 0.25,
            color: showPreview ? 'primary.main' : 'text.secondary',
            opacity: showPreview ? 1 : 0.5,
            transition: 'color 0.2s, opacity 0.2s',
            '&:hover': { opacity: 1 },
          }}>
          {showPreview ? (
            <VisibilityIcon sx={{ fontSize: 14 }} />
          ) : (
            <VisibilityOffIcon sx={{ fontSize: 14 }} />
          )}
        </IconButton>
      </Box>
      <Box
        sx={{
          display: 'inline-block',
          maxWidth: '100%',
          px: { xs: 2, md: 3 },
          py: 1.5,
          borderRadius: 2,
          bgcolor: 'rgba(255, 105, 180, 0.04)',
          border: '1px solid',
          borderColor: 'divider',
        }}>
        <Typography
          sx={{
            fontFamily: 'monospace',
            fontSize: { xs: '0.75rem', md: '0.9rem' },
            letterSpacing: '0.06em',
            color: 'text.secondary',
            lineHeight: 1.6,
            wordBreak: 'break-word',
          }}>
          {scramble}
        </Typography>

        {showPreview && scramble && (
          <ScramblePreview scramble={scramble} eventId={eventId} />
        )}
      </Box>
    </Box>
  );
}
