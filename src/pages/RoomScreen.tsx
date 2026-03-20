import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { observer } from 'mobx-react-lite';
import { reaction } from 'mobx';
import { useTranslation } from 'react-i18next';
import { useStore } from '../lib/hooks/useStore';
import ScrambleDisplay from '../components/timer/ScrambleDisplay';
import Timer from '../components/timer/Timer';
import HostControls from '../components/room/HostControls';
import PlayerSidebar from '../components/room/PlayerSidebar';
import ResultsTable from '../components/room/ResultsTable';
import { getDisplayTime } from '../lib/utils/formatTime';

const LABEL_SX = {
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  fontSize: '0.65rem',
  fontWeight: 700,
  color: 'text.secondary',
} as const;

const RoomScreen = observer(function RoomScreen() {
  const { timerStore, roomStore } = useStore();
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

  const handleCopyCode = () => {
    if (roomStore.roomCode) {
      navigator.clipboard.writeText(roomStore.roomCode);
    }
  };

  const mySolve = roomStore.myCurrentRoundSolve;

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* ── Left Sidebar ───────────────────────────────────── */}
      <Box
        sx={{
          width: 260,
          flexShrink: 0,
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
        }}>
        {/* Sidebar header */}
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography sx={{ ...LABEL_SX, mb: 1.5, fontSize: '0.6rem' }}>
            {t('room.player')}
          </Typography>
          <Typography
            sx={{
              color: 'primary.main',
              fontWeight: 800,
              fontSize: '0.95rem',
            }}>
            {roomStore.playerName}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
            {roomStore.isHost ? t('room.host') : 'Competitor'}
          </Typography>
        </Box>

        <Box
          sx={{
            mx: 2,
            mb: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        />

        {/* Players */}
        <PlayerSidebar />

        <Box sx={{ flex: 1 }} />

        {/* Host controls at bottom of sidebar */}
        <Box sx={{ p: 2, pt: 0 }}>
          <HostControls />
          <Button
            variant="outlined"
            color="error"
            fullWidth
            size="small"
            onClick={handleLeave}
            sx={{ mt: 1 }}>
            {t('room.leave')}
          </Button>
        </Box>
      </Box>

      {/* ── Main Content ───────────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
        {/* Top bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography
              sx={{
                color: 'primary.main',
                fontWeight: 800,
                fontSize: '0.95rem',
                letterSpacing: '0.05em',
              }}>
              ROOM: {roomStore.roomCode}
            </Typography>
            <IconButton size="small" onClick={handleCopyCode} sx={{ p: 0.5 }}>
              <ContentCopyIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            </IconButton>
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('room.playerCount', { count: roomStore.players.length })}
          </Typography>
        </Box>

        {/* Scramble + Timer area */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            px: 4,
            position: 'relative',
          }}>
          {/* Scramble */}
          <ScrambleDisplay scramble={roomStore.currentScramble} />

          {/* Timer or submitted time */}
          {roomStore.hasSubmittedCurrentRound && mySolve ? (
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ ...LABEL_SX, mb: 1 }}>
                {t('room.yourTime')}
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Inter", monospace',
                  fontSize: { xs: '5rem', md: '8rem' },
                  fontWeight: 900,
                  color: 'primary.main',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  userSelect: 'none',
                }}>
                {getDisplayTime(mySolve)}
              </Typography>
            </Box>
          ) : (
            <Timer disabled={roomStore.hasSubmittedCurrentRound} />
          )}
        </Box>

        {/* Results history */}
        <Box
          sx={{
            maxHeight: 220,
            overflow: 'auto',
            px: 3,
            pb: 2,
          }}>
          <ResultsTable />
        </Box>
      </Box>
    </Box>
  );
});

export default RoomScreen;
