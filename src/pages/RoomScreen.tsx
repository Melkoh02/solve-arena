import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
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

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED = 48;

const RoomScreen = observer(function RoomScreen() {
  const { timerStore, roomStore } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Sync sidebar state when crossing breakpoint
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

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
        flexDirection: 'row',
        height: '100vh',
        maxWidth: 1400,
        mx: 'auto',
        width: '100%',
        overflow: 'hidden',
      }}>
      {/* ── Sidebar ────────────────────────────────────────── */}
      <Box
        sx={{
          width: sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED,
          flexShrink: 0,
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
          overflow: 'hidden',
          transition: 'width 0.2s ease',
        }}>
        {/* Toggle button */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: sidebarOpen ? 'flex-end' : 'center',
            p: 0.5,
          }}>
          <IconButton
            size="small"
            onClick={() => setSidebarOpen(prev => !prev)}>
            {sidebarOpen ? (
              <ChevronLeftIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
            ) : (
              <MenuIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
            )}
          </IconButton>
        </Box>

        {/* Sidebar content — only visible when open */}
        <Box
          sx={{
            display: sidebarOpen ? 'flex' : 'none',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden',
            minWidth: SIDEBAR_WIDTH,
          }}>
          {/* Sidebar header */}
          <Box sx={{ px: 2, pb: 1 }}>
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
              <Box
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  alignItems: 'center',
                }}>
                <Typography
                  sx={{
                    color: 'primary.main',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    letterSpacing: '0.05em',
                  }}>
                  {roomStore.roomCode}
                </Typography>
                <IconButton
                  size="small"
                  onClick={handleCopyCode}
                  sx={{ p: 0.25 }}>
                  <ContentCopyIcon
                    sx={{ fontSize: 14, color: 'text.secondary' }}
                  />
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

          <Box sx={{ flex: 1 }} />

          {/* Host controls + leave */}
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
        {/* Top bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 2, md: 3 },
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
              <ContentCopyIcon
                sx={{ fontSize: 16, color: 'text.secondary' }}
              />
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
