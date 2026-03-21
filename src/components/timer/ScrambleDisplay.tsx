import { Box, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ScrambleDisplayProps {
  scramble: string;
  isLoading?: boolean;
}

export default function ScrambleDisplay({
  scramble,
  isLoading = false,
}: ScrambleDisplayProps) {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={20} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ textAlign: 'center', mb: 2, maxWidth: '100%' }}>
      <Typography
        sx={{
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          fontSize: '0.6rem',
          fontWeight: 700,
          color: 'text.secondary',
          mb: 1,
        }}>
        {t('timer.scrambleLabel')}
      </Typography>
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
      </Box>
    </Box>
  );
}
