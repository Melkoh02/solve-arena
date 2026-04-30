import { observer } from 'mobx-react-lite';
import { Box, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../lib/hooks/useStore';
import PuzzleSelector from '../timer/PuzzleSelector';

export interface HostControlsProps {
  onAfterReset?: () => void;
}

const HostControls = observer(function HostControls({
  onAfterReset,
}: HostControlsProps) {
  const { roomStore } = useStore();
  const { t } = useTranslation();

  if (!roomStore.isHost) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <PuzzleSelector
        value={roomStore.eventId}
        onChange={eventId => roomStore.changeEvent(eventId)}
      />
      <Button
        variant="outlined"
        color="primary"
        size="small"
        onClick={() => roomStore.nextScramble()}>
        {t('room.nextScramble')}
      </Button>
      <Button
        variant="outlined"
        color="error"
        size="small"
        onClick={() => {
          roomStore.resetRoom();
          onAfterReset?.();
        }}>
        {t('room.resetRoom')}
      </Button>
    </Box>
  );
});

export default HostControls;
