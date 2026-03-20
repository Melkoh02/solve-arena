import { observer } from 'mobx-react-lite';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useStore } from '../../lib/hooks/useStore';

const ScrambleDisplay = observer(function ScrambleDisplay() {
  const { timerStore } = useStore();

  if (timerStore.isGeneratingScramble) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Typography
      variant="h6"
      sx={{ textAlign: 'center', fontFamily: 'monospace', py: 2, px: 2 }}
    >
      {timerStore.currentScramble}
    </Typography>
  );
});

export default ScrambleDisplay;
