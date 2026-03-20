import { observer } from 'mobx-react-lite';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { WCA_EVENTS } from '../../lib/constants/wcaEvents';

interface PuzzleSelectorProps {
  value: string;
  onChange: (eventId: string) => void;
}

const PuzzleSelector = observer(function PuzzleSelector({
  value,
  onChange,
}: PuzzleSelectorProps) {
  const { t } = useTranslation();

  const handleChange = (e: SelectChangeEvent) => {
    onChange(e.target.value);
  };

  return (
    <FormControl size="small" sx={{ minWidth: 150 }}>
      <InputLabel>{t('timer.puzzle')}</InputLabel>
      <Select value={value} label={t('timer.puzzle')} onChange={handleChange}>
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
