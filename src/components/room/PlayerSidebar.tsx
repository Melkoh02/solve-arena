import { observer } from 'mobx-react-lite';
import {
  Box,
  Button,
  ButtonGroup,
  IconButton,
  Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../lib/hooks/useStore';
import { formatTime, getDisplayTime } from '../../lib/utils/formatTime';
import CrossColorPicker from './CrossColorPicker';
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

const TIME_SX = {
  fontFamily: 'monospace',
  fontVariantNumeric: 'tabular-nums',
  fontSize: '0.8rem',
  fontWeight: 600,
} as const;

const PlayerSidebar = observer(function PlayerSidebar() {
  const { roomStore, settingsStore } = useStore();
  const { t } = useTranslation();
  const precision = settingsStore.timerPrecision;
  const roundSolves = roomStore.currentRoundSolves;
  const prevRound = roomStore.currentRound - 1;

  const getPlayerSolves = (playerId: string): RoomSolve[] =>
    roomStore.solves
      .filter(s => s.playerId === playerId)
      .sort((a, b) => b.round - a.round);

  const getLastSolve = (playerId: string): RoomSolve | undefined =>
    roomStore.solves.find(
      s => s.playerId === playerId && s.round === prevRound,
    );

  return (
    <Box sx={{ px: 1.5, overflow: 'auto', flex: 1 }}>
      <Typography sx={{ ...LABEL_SX, px: 0.5, mb: 1 }}>
        {t('room.competitors')}
      </Typography>

      {roomStore.players.map(player => {
        const currentSolve = roundSolves.find(s => s.playerId === player.id);
        const lastSolve = getLastSolve(player.id);
        const isMe = player.id === roomStore.playerId;
        const playerSolves = getPlayerSolves(player.id);
        const ao5 = calculateAverage(playerSolves, 5, 2);
        const ao12 = calculateAverage(playerSolves, 12, 3);
        const bestTime = roomStore.getBestTime(player.id);
        const hasFinished = !!currentSolve;

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
            {/* Row 1: Name + host badge + status dot */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 0.75,
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
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  flexShrink: 0,
                  bgcolor: hasFinished ? 'primary.main' : 'text.secondary',
                  opacity: hasFinished ? 1 : 0.3,
                  boxShadow: hasFinished
                    ? '0 0 6px rgba(255, 105, 180, 0.5)'
                    : 'none',
                  transition: 'all 0.2s',
                }}
              />
            </Box>

            {/* Row 2: Current + Last + Best */}
            <Box sx={{ display: 'flex', gap: 2, mb: 0.5 }}>
              <Box>
                <Typography sx={{ ...LABEL_SX, fontSize: '0.5rem', mb: 0.25 }}>
                  {t('room.current')}
                </Typography>
                <Typography
                  sx={{
                    ...TIME_SX,
                    color: hasFinished ? 'text.primary' : 'text.secondary',
                  }}>
                  {currentSolve ? getDisplayTime(currentSolve, precision) : '—'}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ ...LABEL_SX, fontSize: '0.5rem', mb: 0.25 }}>
                  {t('room.last')}
                </Typography>
                <Typography
                  sx={{ ...TIME_SX, color: 'text.secondary' }}>
                  {lastSolve ? getDisplayTime(lastSolve, precision) : '—'}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ ...LABEL_SX, fontSize: '0.5rem', mb: 0.25 }}>
                  {t('room.best')}
                </Typography>
                <Typography
                  sx={{ ...TIME_SX, color: 'text.secondary' }}>
                  {bestTime !== null ? formatTime(bestTime, precision) : '—'}
                </Typography>
              </Box>
            </Box>

            {/* Row 3: ao5 / ao12 + kick button */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                  ao5: {formatAverage(ao5, precision)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                  ao12: {formatAverage(ao12, precision)}
                </Typography>
              </Box>
              {roomStore.isHost && !isMe && (
                <IconButton
                  size="small"
                  onClick={() => roomStore.kickPlayer(player.id)}
                  title={t('room.kick')}
                  sx={{ p: 0.25 }}>
                  <LogoutIcon
                    sx={{ fontSize: 13, color: 'text.secondary' }}
                  />
                </IconButton>
              )}
            </Box>

            {/* Row 4: Penalty buttons + cross color (own current-round solve) */}
            {currentSolve && isMe && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75 }}>
                <ButtonGroup size="small">
                  <Button
                    variant={
                      currentSolve.penalty === '+2' ? 'contained' : 'outlined'
                    }
                    sx={{ minWidth: 32, fontSize: '0.65rem', py: 0 }}
                    onClick={() =>
                      roomStore.updatePenalty(currentSolve.id, '+2' as Penalty)
                    }>
                    +2
                  </Button>
                  <Button
                    variant={
                      currentSolve.penalty === 'DNF' ? 'contained' : 'outlined'
                    }
                    sx={{ minWidth: 32, fontSize: '0.65rem', py: 0 }}
                    onClick={() =>
                      roomStore.updatePenalty(currentSolve.id, 'DNF' as Penalty)
                    }>
                    DNF
                  </Button>
                </ButtonGroup>
                <CrossColorPicker
                  value={currentSolve.crossColor}
                  onChange={color => roomStore.updateCrossColor(currentSolve.id, color)}
                  size={20}
                />
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
});

export default PlayerSidebar;
