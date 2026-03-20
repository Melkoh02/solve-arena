import { observer } from 'mobx-react-lite';
import { Button, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../lib/hooks/useStore';
import PuzzleSelector from '../timer/PuzzleSelector';

const HostControls = observer(function HostControls() {
  const { roomStore } = useStore();
  const { t } = useTranslation();

  if (!roomStore.isHost) return null;

  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
      <PuzzleSelector
        value={roomStore.eventId}
        onChange={eventId => roomStore.changeEvent(eventId)}
      />
      <Button variant="outlined" onClick={() => roomStore.nextScramble()}>
        {t('room.nextScramble')}
      </Button>
    </Stack>
  );
});

export default HostControls;
