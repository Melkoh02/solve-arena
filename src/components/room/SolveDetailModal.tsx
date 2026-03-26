import { observer } from 'mobx-react-lite';
import {
  Box,
  Button,
  ButtonGroup,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../lib/hooks/useStore';
import { getDisplayTime } from '../../lib/utils/formatTime';
import type { CrossColor, RoomSolve } from '../../lib/types/room';
import type { Penalty } from '../../lib/types/timer';

import { CROSS_COLORS } from '../../lib/constants/crossColors';

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
  const { roomStore, settingsStore } = useStore();
  const { t, i18n } = useTranslation();
  const precision = settingsStore.timerPrecision;

  if (!solve) return null;

  const isMe = solve.playerId === roomStore.playerId;

  return (
    <Dialog
      open={!!solve}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            backgroundImage: 'none',
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
        <Box>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, color: 'text.primary' }}>
            {t('room.solveDetails')}
          </Typography>
          <Typography
            sx={{
              ...LABEL_SX,
              mb: 0,
              fontSize: '0.55rem',
            }}>
            {t('room.round')} {solve.round}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'rgba(255, 105, 180, 0.06)',
            p: 2,
            mb: 2,
            textAlign: 'center',
          }}>
          <Typography sx={{ ...LABEL_SX, mb: 0.75 }}>
            {t('room.yourTime')}
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Inter", monospace',
              fontSize: 'clamp(2.2rem, 10vw, 3.2rem)',
              fontWeight: 900,
              fontVariantNumeric: 'tabular-nums',
              color: isMe ? 'primary.main' : 'text.primary',
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}>
            {getDisplayTime(solve, precision)}
          </Typography>
        </Box>

        {/* Penalty buttons (own solves only) */}
        {isMe && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
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

        {/* Cross color */}
        {solve.crossColor && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ ...LABEL_SX, mb: 0.75, textAlign: 'center' }}>
              {t('room.crossColor')}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.75 }}>
              {CROSS_COLORS.map(c => {
                const isSelected = solve.crossColor === c.key;
                return (
                  <Box
                    key={c.key}
                    onClick={isMe ? () => roomStore.updateCrossColor(solve.id, c.key) : undefined}
                    title={`${c.label} (${c.key.toUpperCase()})`}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: c.hex,
                      cursor: isMe ? 'pointer' : 'default',
                      border: '2px solid',
                      borderColor: isSelected ? 'primary.main' : 'transparent',
                      boxShadow: isSelected
                        ? `0 0 8px ${c.hex}80`
                        : 'none',
                      opacity: isSelected ? 1 : 0.5,
                      transition: 'all 0.15s',
                      '&:hover': isMe ? { opacity: 1 } : {},
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        )}

        <Stack spacing={1.25}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 1,
            }}>
            <Box
              sx={{
                p: 1.25,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.default',
              }}>
              <Typography sx={LABEL_SX}>{t('room.player')}</Typography>
              <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>
                {solve.playerName}
              </Typography>
            </Box>

            <Box
              sx={{
                p: 1.25,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.default',
              }}>
              <Typography sx={LABEL_SX}>{t('room.round')}</Typography>
              <Typography sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                {solve.round}
              </Typography>
            </Box>

            <Box
              sx={{
                p: 1.25,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.default',
              }}>
              <Typography sx={LABEL_SX}>{t('room.dateTime')}</Typography>
              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                {new Date(solve.date).toLocaleString(i18n.language)}
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography sx={LABEL_SX}>{t('room.scrambleLabel')}</Typography>
            <Box
              sx={{
                p: 1.25,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.default',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                color: 'text.secondary',
                lineHeight: 1.6,
                wordBreak: 'break-word',
              }}>
              {solve.scramble}
            </Box>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
});

export default SolveDetailModal;
