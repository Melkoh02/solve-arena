import { observer } from 'mobx-react-lite';
import { Box, IconButton, Stack, ToggleButton, Typography } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import GroupsIcon from '@mui/icons-material/Groups';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../../lib/hooks/useStore';
import { getDisplayTime } from '../../../lib/utils/formatTime';
import CrossColorPicker from '../../room/CrossColorPicker';
import type { SoloSolve } from '../../../lib/stores/soloStore';
import type { Penalty } from '../../../lib/types/timer';

function formatShortDate(ts: number): string {
  const d = new Date(ts);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${mins}`;
}

export interface HistoryCardProps {
  solve: SoloSolve;
  index: number;
  onSelect: (solve: SoloSolve) => void;
  onRequestDelete: (solve: SoloSolve) => void;
}

const HistoryCard = observer(function HistoryCard({
  solve,
  index,
  onSelect,
  onRequestDelete,
}: HistoryCardProps) {
  const { soloStore, settingsStore } = useStore();
  const { t } = useTranslation();
  const precision = settingsStore.timerPrecision;

  // Store already toggles back to 'none' when the same penalty is re-applied
  const togglePenalty = (next: Penalty) => {
    soloStore.updatePenalty(solve.id, next);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 1.25,
        borderRadius: 2,
        bgcolor: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid',
        borderColor: 'divider',
      }}>
      {/* Index */}
      <Typography
        sx={{
          fontFamily: 'monospace',
          fontSize: '0.7rem',
          color: 'text.secondary',
          minWidth: 36,
          flexShrink: 0,
        }}>
        #{index}
      </Typography>

      {/* Time + date stack */}
      <Stack
        sx={{ minWidth: 0, flex: 1 }}
        onClick={() => onSelect(solve)}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          {solve.online && (
            <GroupsIcon
              titleAccess={t('solo.onlineTooltip')}
              sx={{ fontSize: 14, color: 'text.secondary', opacity: 0.5 }}
            />
          )}
          <Typography
            sx={{
              fontFamily: 'monospace',
              fontVariantNumeric: 'tabular-nums',
              fontSize: '1.4rem',
              fontWeight: 700,
              cursor: 'pointer',
              lineHeight: 1.1,
            }}>
            {getDisplayTime(solve, precision)}
          </Typography>
        </Stack>
        <Typography
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.7rem',
            color: 'text.secondary',
            mt: 0.25,
          }}>
          {formatShortDate(solve.date)}
        </Typography>
      </Stack>

      {/* Penalty toggles */}
      <Stack direction="row" spacing={0.5}>
        <ToggleButton
          value="+2"
          selected={solve.penalty === '+2'}
          onChange={() => togglePenalty('+2')}
          size="small"
          sx={{
            minWidth: 36,
            px: 0.75,
            py: 0.5,
            fontSize: '0.7rem',
            fontWeight: 700,
            border: '1px solid',
            borderColor: 'divider',
            color: 'text.secondary',
            '&.Mui-selected': {
              bgcolor: 'rgba(255, 105, 180, 0.16)',
              color: 'primary.main',
              borderColor: 'primary.main',
            },
          }}>
          +2
        </ToggleButton>
        <ToggleButton
          value="DNF"
          selected={solve.penalty === 'DNF'}
          onChange={() => togglePenalty('DNF')}
          size="small"
          sx={{
            minWidth: 40,
            px: 0.75,
            py: 0.5,
            fontSize: '0.7rem',
            fontWeight: 700,
            border: '1px solid',
            borderColor: 'divider',
            color: 'text.secondary',
            '&.Mui-selected': {
              bgcolor: 'rgba(255, 105, 180, 0.16)',
              color: 'primary.main',
              borderColor: 'primary.main',
            },
          }}>
          DNF
        </ToggleButton>
      </Stack>

      {/* Cross color */}
      <CrossColorPicker
        value={solve.crossColor}
        onChange={color => soloStore.updateCrossColor(solve.id, color)}
        size={22}
      />

      {/* Delete */}
      <IconButton
        size="small"
        onClick={() => onRequestDelete(solve)}
        sx={{ color: 'text.secondary', opacity: 0.6 }}
        aria-label={t('solo.deleteSolve')}>
        <DeleteOutlineIcon sx={{ fontSize: 20 }} />
      </IconButton>
    </Box>
  );
});

export default HistoryCard;
