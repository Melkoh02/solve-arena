import { observer } from 'mobx-react-lite';
import {
  Box,
  Button,
  ButtonGroup,
  IconButton,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../lib/hooks/useStore';
import { getDisplayTime } from '../../lib/utils/formatTime';
import { calculateAverage, formatAverage } from '../../lib/utils/averages';
import type { Penalty } from '../../lib/types/timer';
import type { RoomSolve } from '../../lib/types/room';

const LABEL_SX = {
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  fontSize: '0.6rem',
  fontWeight: 700,
  color: 'text.secondary',
} as const;

const PlayerSidebar = observer(function PlayerSidebar() {
  const { roomStore } = useStore();
  const { t } = useTranslation();
  const roundSolves = roomStore.currentRoundSolves;

  const getPlayerSolves = (playerId: string): RoomSolve[] =>
    roomStore.solves
      .filter(s => s.playerId === playerId)
      .sort((a, b) => b.round - a.round);

  return (
    <Box sx={{ px: 1.5, overflow: 'auto', flex: 1 }}>
      <Typography sx={{ ...LABEL_SX, px: 0.5, mb: 1 }}>
        {t('room.competitors')}
      </Typography>

      {roomStore.players.map(player => {
        const solve = roundSolves.find(s => s.playerId === player.id);
        const isMe = player.id === roomStore.playerId;
        const playerSolves = getPlayerSolves(player.id);
        const ao5 = calculateAverage(playerSolves, 5, 2);
        const ao12 = calculateAverage(playerSolves, 12, 3);

        return (
          <Box
            key={player.id}
            sx={{
              p: 1.5,
              mb: 1,
              borderRadius: 2,
              border: '1px solid',
              borderColor: isMe
                ? 'rgba(255, 105, 180, 0.3)'
                : 'rgba(255, 105, 180, 0.06)',
              bgcolor: isMe ? 'rgba(255, 105, 180, 0.05)' : 'transparent',
              transition: 'all 0.15s',
            }}>
            {/* Name row */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 0.5,
              }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: isMe ? 'primary.main' : 'text.primary',
                  }}>
                  {isMe ? t('room.you') : player.name}
                </Typography>
                {player.isHost && (
                  <Typography
                    sx={{
                      fontSize: '0.55rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'primary.main',
                      opacity: 0.7,
                    }}>
                    {t('room.host')}
                  </Typography>
                )}
              </Box>

              {/* Status dot */}
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: solve ? 'primary.main' : 'text.secondary',
                  opacity: solve ? 1 : 0.4,
                  boxShadow: solve
                    ? '0 0 6px rgba(255, 105, 180, 0.5)'
                    : 'none',
                }}
              />
            </Box>

            {/* Time / Status */}
            <Typography
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: solve ? 'text.primary' : 'text.secondary',
              }}>
              {solve ? getDisplayTime(solve) : t('room.solving')}
            </Typography>

            {/* ao5 / ao12 */}
            {playerSolves.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                  ao5: {formatAverage(ao5)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                  ao12: {formatAverage(ao12)}
                </Typography>
              </Box>
            )}

            {/* Penalty buttons for own current-round solve */}
            {solve && isMe && (
              <ButtonGroup size="small" sx={{ mt: 0.5 }}>
                <Button
                  variant={solve.penalty === '+2' ? 'contained' : 'outlined'}
                  sx={{ minWidth: 32, fontSize: '0.65rem', py: 0 }}
                  onClick={() =>
                    roomStore.updatePenalty(solve.id, '+2' as Penalty)
                  }>
                  +2
                </Button>
                <Button
                  variant={solve.penalty === 'DNF' ? 'contained' : 'outlined'}
                  sx={{ minWidth: 32, fontSize: '0.65rem', py: 0 }}
                  onClick={() =>
                    roomStore.updatePenalty(solve.id, 'DNF' as Penalty)
                  }>
                  DNF
                </Button>
              </ButtonGroup>
            )}

            {/* Kick button for host */}
            {roomStore.isHost && !isMe && (
              <Box sx={{ mt: 0.5 }}>
                <IconButton
                  size="small"
                  onClick={() => roomStore.kickPlayer(player.id)}
                  sx={{ p: 0.25 }}>
                  <DeleteIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                </IconButton>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
});

export default PlayerSidebar;
