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
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        height: '100vh',
        maxWidth: 1400,
        mx: 'auto',
        width: '100%',
      }}>
      {/* ── Left Sidebar (desktop) / Top panel (mobile) ──── */}
      <Box
        sx={{
          width: { xs: '100%', md: 260 },
          flexShrink: 0,
          borderRight: { xs: 'none', md: '1px solid' },
          borderBottom: { xs: '1px solid', md: 'none' },
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
          maxHeight: { xs: '40vh', md: '100vh' },
          overflow: 'auto',
        }}>
        {/* Sidebar header */}
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography sx={{ ...LABEL_SX, mb: 1, fontSize: '0.6rem' }}>
            {t('room.player')}
          </Typography>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center">
            <Box>
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
            {/* Mobile: show room code in sidebar header */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 0.5, alignItems: 'center' }}>
              <Typography
                sx={{
                  color: 'primary.main',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  letterSpacing: '0.05em',
                }}>
                {roomStore.roomCode}
              </Typography>
              <IconButton size="small" onClick={handleCopyCode} sx={{ p: 0.25 }}>
                <ContentCopyIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              </IconButton>
            </Box>
          </Stack>
        </Box>

        <Box
          sx={{
            mx: 2,
            mb: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        />

        <PlayerSidebar />

        <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />

        {/* Host controls + leave — bottom of sidebar on desktop */}
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
          minWidth: 0,
        }}>
        {/* Top bar — desktop only (mobile shows code in sidebar) */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
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
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 2, md: 0 },
            overflow: 'auto',
            minHeight: 0,
          }}>
          <ScrambleDisplay scramble={roomStore.currentScramble} />

          {roomStore.hasSubmittedCurrentRound && mySolve ? (
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ ...LABEL_SX, mb: 1 }}>
                {t('room.yourTime')}
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Inter", monospace',
                  fontSize: 'clamp(3rem, 12vw, 8rem)',
                  fontWeight: 900,
                  fontVariantNumeric: 'tabular-nums',
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

        {/* Results history — fixed height so it never pushes the timer */}
        <Box
          sx={{
            height: { xs: 160, md: 220 },
            flexShrink: 0,
            overflow: 'auto',
            px: { xs: 1.5, sm: 2, md: 3 },
            pb: 2,
          }}>
          <ResultsTable />
        </Box>
      </Box>
    </Box>
  );
});

export default RoomScreen;
