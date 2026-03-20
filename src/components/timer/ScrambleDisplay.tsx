import { Box, CircularProgress, Typography } from '@mui/material';

interface ScrambleDisplayProps {
  scramble: string;
  isLoading?: boolean;
}

export default function ScrambleDisplay({
  scramble,
  isLoading = false,
}: ScrambleDisplayProps) {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={20} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ textAlign: 'center', mb: 2 }}>
      <Typography
        sx={{
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          fontSize: '0.6rem',
          fontWeight: 700,
          color: 'text.secondary',
          mb: 1,
        }}>
        Scramble
      </Typography>
      <Box
        sx={{
          display: 'inline-block',
          px: 3,
          py: 1.5,
          borderRadius: 2,
          bgcolor: 'rgba(255, 105, 180, 0.04)',
          border: '1px solid',
          borderColor: 'divider',
        }}>
        <Typography
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            letterSpacing: '0.06em',
            color: 'text.secondary',
            lineHeight: 1.6,
          }}>
          {scramble}
        </Typography>
      </Box>
    </Box>
  );
}
