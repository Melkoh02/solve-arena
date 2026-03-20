import { observer } from 'mobx-react-lite';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../lib/hooks/useStore';
import { WCA_EVENTS } from '../../lib/constants/wcaEvents';

const PuzzleSelector = observer(function PuzzleSelector() {
  const { timerStore } = useStore();
  const { t } = useTranslation();

  const handleChange = (e: SelectChangeEvent) => {
    const event = WCA_EVENTS.find(ev => ev.id === e.target.value);
    if (event) timerStore.setEvent(event);
  };

  return (
    <FormControl size="small" sx={{ minWidth: 150 }}>
      <InputLabel>{t('timer.puzzle')}</InputLabel>
      <Select
        value={timerStore.currentEvent.id}
        label={t('timer.puzzle')}
        onChange={handleChange}
      >
        {WCA_EVENTS.map(event => (
          <MenuItem key={event.id} value={event.id}>
            {event.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
});

export default PuzzleSelector;
