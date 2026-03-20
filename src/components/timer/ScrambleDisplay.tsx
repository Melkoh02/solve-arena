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
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Typography
      variant="h6"
      sx={{ textAlign: 'center', fontFamily: 'monospace', py: 2, px: 2 }}>
      {scramble}
    </Typography>
  );
}
