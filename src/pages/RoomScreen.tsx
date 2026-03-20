import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import { reaction } from 'mobx';
import { useTranslation } from 'react-i18next';
import { useStore } from '../lib/hooks/useStore';
import { useTheme } from '../lib/hooks/useTheme';
import LanguageSelect from '../components/organisims/LanguageSelect';
import ScrambleDisplay from '../components/timer/ScrambleDisplay';
import Timer from '../components/timer/Timer';
import HostControls from '../components/room/HostControls';
import PlayerList from '../components/room/PlayerList';
import ResultsTable from '../components/room/ResultsTable';
import { getDisplayTime } from '../lib/utils/formatTime';

const RoomScreen = observer(function RoomScreen() {
  const { timerStore, roomStore, themeStore } = useStore();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Submit time when timer stops
  useEffect(
    () =>
      reaction(
        () => timerStore.timerPhase,
        phase => {
          if (phase === 'stopped' && !roomStore.hasSubmittedCurrentRound) {
            roomStore.submitTime(timerStore.displayTime);
          }
        },
      ),
    [timerStore, roomStore],
  );

  // Reset timer when new round starts
  useEffect(
    () =>
      reaction(
        () => roomStore.currentRound,
        () => {
          timerStore.resetToIdle();
        },
      ),
    [timerStore, roomStore],
  );

  // Redirect to lobby if not in room
  useEffect(() => {
    // Also check immediately
    if (!roomStore.isInRoom && !roomStore.isJoining) {
      navigate('/');
    }
    return reaction(
      () => roomStore.isInRoom,
      isInRoom => {
        if (!isInRoom && !roomStore.isJoining) {
          navigate('/');
        }
      },
    );
  }, [roomStore, navigate]);

  const handleLeave = () => {
    roomStore.leaveRoom();
    navigate('/');
  };

  const mySolve = roomStore.myCurrentRoundSolve;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        p: 2,
      }}>
      {/* Top bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
        }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h6">{t('room.title')}</Typography>
          <Chip
            label={roomStore.roomCode}
            variant="outlined"
            sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem' }}
          />
          <Typography variant="body2" color="text.secondary">
            {t('room.playerCount', { count: roomStore.players.length })}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <FormControlLabel
            sx={{ m: 0 }}
            control={
              <Switch
                checked={theme.scheme === 'dark'}
                onChange={themeStore.toggle}
                size="small"
              />
            }
            label=""
          />
          <LanguageSelect />
          <Button variant="outlined" color="error" onClick={handleLeave}>
            {t('room.leave')}
          </Button>
        </Stack>
      </Box>

      {/* Host controls */}
      <HostControls />

      {/* Scramble */}
      <ScrambleDisplay scramble={roomStore.currentScramble} />

      {/* Timer or submitted time */}
      {roomStore.hasSubmittedCurrentRound && mySolve ? (
        <Typography
          variant="h1"
          sx={{
            fontFamily: 'monospace',
            fontSize: '6rem',
            fontWeight: 700,
            textAlign: 'center',
            color: 'text.secondary',
            userSelect: 'none',
            py: 4,
          }}>
          {getDisplayTime(mySolve)}
        </Typography>
      ) : (
        <Timer disabled={roomStore.hasSubmittedCurrentRound} />
      )}

      {/* Player results + history */}
      <Box sx={{ flex: 1, overflow: 'auto', mt: 2 }}>
        <PlayerList />
        <ResultsTable />
      </Box>
    </Box>
  );
});

export default RoomScreen;
