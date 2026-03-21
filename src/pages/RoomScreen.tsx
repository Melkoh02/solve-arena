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
import CloseIcon from '@mui/icons-material/Close';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { observer } from 'mobx-react-lite';
import { reaction } from 'mobx';
import { useTranslation } from 'react-i18next';
import { useStore } from '../lib/hooks/useStore';
import ScrambleDisplay from '../components/timer/ScrambleDisplay';
import Timer, { useTimerTouch } from '../components/timer/Timer';
import HostControls from '../components/room/HostControls';
import PlayerSidebar from '../components/room/PlayerSidebar';
import ResultsTable from '../components/room/ResultsTable';
import LanguageSelect from '../components/organisims/LanguageSelect';
import { getDisplayTime } from '../lib/utils/formatTime';

const LABEL_SX = {
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  fontSize: '0.65rem',
  fontWeight: 700,
  color: 'text.secondary',
} as const;

const SIDEBAR_WIDTH = 260;

const RoomScreen = observer(function RoomScreen() {
  const { timerStore, roomStore, themeStore } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const isTimerDisabled = roomStore.hasSubmittedCurrentRound;
  const touchHandlers = useTimerTouch(isTimerDisabled);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(
    () =>
      reaction(
        () => timerStore.timerPhase,
        phase => {
          if (phase === 'stopped' && !roomStore.hasSubmittedCurrentRound) {
            roomStore.submitTime(timerStore.displayTime, timerStore.lastStopWasDnf);
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
  const isTimerRunning = timerStore.timerPhase === 'running';

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
      {/* ── Sidebar — fully hidden when closed or timer running ── */}
      {sidebarOpen && !isTimerRunning && (
        <Box
          sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            borderRight: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper',
            overflow: 'hidden',
          }}>
          {/* Close button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => setSidebarOpen(false)}>
              <CloseIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            </IconButton>
          </Box>

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
                  {roomStore.isHost ? t('room.host') : t('room.competitor')}
                </Typography>
              </Box>
              <Box
                sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
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
      )}

      {/* ── Main Content ───────────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}>
        {/* Top bar — hidden when timer is running */}
        {!isTimerRunning && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: { xs: 1.5, md: 3 },
              py: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}>
            <Stack direction="row" spacing={1} alignItems="center">
              {/* Sidebar toggle — visible when sidebar is closed */}
              {!sidebarOpen && (
                <IconButton
                  size="small"
                  onClick={() => setSidebarOpen(true)}
                  sx={{ mr: 0.5 }}>
                  <MenuIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                </IconButton>
              )}
              <Typography
                sx={{
                  color: 'primary.main',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  letterSpacing: '0.05em',
                }}>
                {t('room.roomLabel')}: {roomStore.roomCode}
              </Typography>
              <IconButton size="small" onClick={handleCopyCode} sx={{ p: 0.5 }}>
                <ContentCopyIcon
                  sx={{ fontSize: 16, color: 'text.secondary' }}
                />
              </IconButton>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t('room.playerCount', { count: roomStore.players.length })}
              </Typography>
              <IconButton
                size="small"
                onClick={themeStore.toggle}
                aria-label={t('settings.toggleTheme')}
                title={t('settings.toggleTheme')}>
                {themeStore.scheme === 'dark' ? (
                  <LightModeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                ) : (
                  <DarkModeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                )}
              </IconButton>
              <LanguageSelect />
            </Stack>
          </Box>
        )}

        {/* Scramble + Timer area — full touch target */}
        <Box
          onTouchStart={touchHandlers.onTouchStart}
          onTouchEnd={touchHandlers.onTouchEnd}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            px: { xs: 2, sm: 3, md: 4 },
            overflow: 'auto',
            minHeight: 0,
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
            cursor: 'pointer',
          }}>
          {!isTimerRunning && (
            <ScrambleDisplay scramble={roomStore.currentScramble} eventId={roomStore.eventId} />
          )}

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
            <Timer disabled={isTimerDisabled} />
          )}
        </Box>

        {/* Results history — hidden when timer is running */}
        {!isTimerRunning && (
          <Box
            sx={{
              height: { xs: 160, md: 220 },
              flexShrink: 0,
              px: { xs: 1.5, sm: 2, md: 3 },
              pb: 2,
            }}>
            <ResultsTable />
          </Box>
        )}
      </Box>
    </Box>
  );
});

export default RoomScreen;
