import { observer } from 'mobx-react-lite';
import {
  Box,
  Button,
  ButtonGroup,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../lib/hooks/useStore';
import { getDisplayTime } from '../../lib/utils/formatTime';
import type { RoomSolve } from '../../lib/types/room';
import type { Penalty } from '../../lib/types/timer';

const LABEL_SX = {
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  fontSize: '0.6rem',
  fontWeight: 700,
  color: 'text.secondary',
  mb: 0.5,
} as const;

interface SolveDetailModalProps {
  solve: RoomSolve | null;
  onClose: () => void;
}

const SolveDetailModal = observer(function SolveDetailModal({
  solve,
  onClose,
}: SolveDetailModalProps) {
  const { roomStore } = useStore();
  const { t } = useTranslation();

  if (!solve) return null;

  const isMe = solve.playerId === roomStore.playerId;

  return (
    <Dialog
      open={!!solve}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
          },
        },
      }}>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, color: 'text.primary' }}>
          {t('room.solveDetails')}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {/* Time */}
        <Typography
          sx={{
            fontFamily: '"Inter", monospace',
            fontSize: '2.5rem',
            fontWeight: 900,
            fontVariantNumeric: 'tabular-nums',
            color: isMe ? 'primary.main' : 'text.primary',
            textAlign: 'center',
            mb: 2,
          }}>
          {getDisplayTime(solve)}
        </Typography>

        {/* Penalty buttons (own solves only) */}
        {isMe && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <ButtonGroup size="small">
              <Button
                variant={solve.penalty === '+2' ? 'contained' : 'outlined'}
                onClick={() =>
                  roomStore.updatePenalty(solve.id, '+2' as Penalty)
                }
                sx={{ minWidth: 48 }}>
                +2
              </Button>
              <Button
                variant={solve.penalty === 'DNF' ? 'contained' : 'outlined'}
                onClick={() =>
                  roomStore.updatePenalty(solve.id, 'DNF' as Penalty)
                }
                sx={{ minWidth: 48 }}>
                DNF
              </Button>
            </ButtonGroup>
          </Box>
        )}

        {/* Details */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Player */}
          <Box>
            <Typography sx={LABEL_SX}>{t('room.player')}</Typography>
            <Typography sx={{ fontWeight: 600 }}>
              {solve.playerName}
            </Typography>
          </Box>

          {/* Round */}
          <Box>
            <Typography sx={LABEL_SX}>{t('room.round')}</Typography>
            <Typography sx={{ fontFamily: 'monospace' }}>
              {solve.round}
            </Typography>
          </Box>

          {/* Scramble */}
          <Box>
            <Typography sx={LABEL_SX}>{t('room.scrambleLabel')}</Typography>
            <Typography
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                color: 'text.secondary',
                lineHeight: 1.6,
                wordBreak: 'break-word',
              }}>
              {solve.scramble}
            </Typography>
          </Box>

          {/* Date & time */}
          <Box>
            <Typography sx={LABEL_SX}>{t('room.dateTime')}</Typography>
            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
              {new Date(solve.date).toLocaleString()}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
});

export default SolveDetailModal;
