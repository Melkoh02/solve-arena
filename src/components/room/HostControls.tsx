import { observer } from 'mobx-react-lite';
import { Box, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../lib/hooks/useStore';
import PuzzleSelector from '../timer/PuzzleSelector';

const HostControls = observer(function HostControls() {
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
        onClick={() => roomStore.resetRoom()}>
        {t('room.resetRoom')}
      </Button>
    </Box>
  );
});

export default HostControls;
