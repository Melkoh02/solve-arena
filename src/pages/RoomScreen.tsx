import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  IconButton,
  Snackbar,
  Stack,
  Typography,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import SettingsIcon from '@mui/icons-material/Settings';
import { observer } from 'mobx-react-lite';
import { reaction } from 'mobx';
import { useTranslation } from 'react-i18next';
import { useStore } from '../lib/hooks/useStore';
import { useIsMobile } from '../lib/hooks/useIsMobile';
import { vhSafe } from '../lib/utils/viewport';
import ScrambleDisplay from '../components/timer/ScrambleDisplay';
import Timer, { useTimerTouch } from '../components/timer/Timer';
import HostControls from '../components/room/HostControls';
import PlayerSidebar from '../components/room/PlayerSidebar';
import ResultsTable from '../components/room/ResultsTable';
import MobileRoomLayout from '../components/room/mobile/MobileRoomLayout';
import SettingsDialog from '../components/settings/SettingsDialog';
import { formatTime, getDisplayTime } from '../lib/utils/formatTime';
import { calculateAverage, formatAverage } from '../lib/utils/averages';
import type { PbNotification } from '../lib/stores/roomStore';
import type { CrossColor } from '../lib/types/room';

const LABEL_SX = {
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  fontSize: '0.65rem',
  fontWeight: 700,
  color: 'text.secondary',
} as const;

const SIDEBAR_WIDTH = 260;

const RoomScreen = observer(function RoomScreen() {
  const { timerStore, roomStore, soloStore, settingsStore } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { code: urlCode } = useParams<{ code: string }>();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const useMobileLayout = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const [pbSnack, setPbSnack] = useState<PbNotification | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pbSnackRef = useRef(pbSnack);
  pbSnackRef.current = pbSnack;

  const pendingColorRef = useRef<CrossColor>('w');
  // Track round + color for deferred application when solve arrives from server
  const pendingColorForRoundRef = useRef<{ round: number; color: CrossColor } | null>(null);

  const handleColorStart = useCallback((color: CrossColor) => {
    const phase = timerStore.timerPhase;
    if (phase === 'running') {
      // Queue color to apply when timer stops
      pendingColorRef.current = color;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isTimerDisabled = roomStore.hasSubmittedOrPendingCurrentRound;

  // Handle color keys when timer is disabled (after submitting)
  // Instead of applying directly (solve may not be in store yet), save to pending
  useEffect(() => {
    const COLOR_KEYS: Record<string, CrossColor> = {
      w: 'w', y: 'y', r: 'r', o: 'o', b: 'b', g: 'g',
    };
    const handleKey = (e: KeyboardEvent) => {
      if (timerStore.timerPhase === 'running') return;
      if (!roomStore.hasSubmittedOrPendingCurrentRound) return;
      const color = COLOR_KEYS[e.key.toLowerCase()];
      if (!color) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
      // Try to apply directly if solve already exists
      const mySolve = roomStore.myCurrentRoundSolve;
      if (mySolve) {
        roomStore.updateCrossColor(mySolve.id, color);
      } else {
        // Solve not in store yet — queue for when it arrives
        pendingColorForRoundRef.current = { round: roomStore.currentRound, color };
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [roomStore, timerStore]);

  // Apply pending color when my solve appears in the store
  useEffect(
    () =>
      reaction(
        () => roomStore.solves.length,
        () => {
          const pending = pendingColorForRoundRef.current;
          if (!pending) return;
          const myId = roomStore.playerId;
          if (!myId) return;
          const solve = roomStore.solves.find(
            s => s.playerId === myId && s.round === pending.round,
          );
          if (solve) {
            roomStore.updateCrossColor(solve.id, pending.color);
            pendingColorForRoundRef.current = null;
          }
        },
      ),
    [roomStore],
  );
  const touchHandlers = useTimerTouch(isTimerDisabled, handleColorStart);

  // Drain PB notification queue when timer is NOT running
  useEffect(
    () =>
      reaction(
        () => ({
          phase: timerStore.timerPhase,
          queueLen: roomStore.pbNotificationQueue.length,
        }),
        ({ phase }) => {
          if (phase === 'running') return;
          if (pbSnackRef.current) return;
          const next = roomStore.shiftPbNotification();
          if (next) setPbSnack(next);
        },
      ),
    [timerStore, roomStore],
  );

  const handlePbSnackClose = () => {
    setPbSnack(null);
    setTimeout(() => {
      if (timerStore.timerPhase === 'running') return;
      const next = roomStore.shiftPbNotification();
      if (next) setPbSnack(next);
    }, 300);
  };

  // Reset timer to 0.00 when entering a room (e.g. after a solo solve)
  useEffect(() => {
    timerStore.resetToIdle();
  }, [timerStore]);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Submit time and apply pending cross color
  useEffect(
    () =>
      reaction(
        () => timerStore.timerPhase,
        (phase, prevPhase) => {
          if (phase === 'running' && prevPhase !== 'running') {
            roomStore.emitTimerStart();
          }
          if (phase === 'stopped' && prevPhase === 'running' && !roomStore.hasSubmittedCurrentRound) {
            const color = pendingColorRef.current;
            if (color !== 'w') {
              // Queue color for when the solve arrives from server
              pendingColorForRoundRef.current = { round: roomStore.currentRound, color };
            }
            roomStore.submitTime(timerStore.displayTime, timerStore.lastStopWasDnf);
            pendingColorRef.current = 'w';
          }
        },
      ),
    [timerStore, roomStore],
  );

  useEffect(
    () =>
      reaction(
        () => roomStore.currentRound,
        (round) => {
          timerStore.resetToIdle();
          // Play notification sound when new round starts and tab is not visible
          if (round > 1 && document.hidden) {
            try {
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = 880;
              osc.type = 'sine';
              gain.gain.value = 0.3;
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
              osc.start();
              osc.stop(ctx.currentTime + 0.3);
              osc.onended = () => ctx.close();
            } catch {
              // AudioContext not available
            }
          }
        },
      ),
    [timerStore, roomStore],
  );

  // Sync my solves to soloStore so they persist locally
  useEffect(
    () =>
      reaction(
        () => roomStore.solves.map(s => `${s.id}:${s.penalty}:${s.crossColor}`).join(),
        () => {
          const myId = roomStore.playerId;
          if (!myId) return;
          for (const solve of roomStore.solves) {
            if (solve.playerId !== myId) continue;
            soloStore.syncFromRoom(solve, roomStore.eventId);
          }
        },
      ),
    [roomStore, soloStore],
  );

  useEffect(() => {
    if (!roomStore.isInRoom && !roomStore.isJoining && !roomStore.isReconnecting) {
      // Try auto-join from URL if we have a code and a saved name
      if (urlCode && roomStore.playerName.trim()) {
        roomStore.joinRoom(urlCode).then(success => {
          if (!success) navigate('/');
        });
        return;
      }
      navigate('/');
      return;
    }
    return reaction(
      () => roomStore.isInRoom,
      isInRoom => {
        if (!isInRoom && !roomStore.isJoining && !roomStore.isReconnecting) {
          navigate('/');
        }
      },
    );
  }, [roomStore, navigate, urlCode]);

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
  const shouldShowWaitingState =
    roomStore.isWaitingForOtherPlayers &&
    !isTimerRunning &&
    !roomStore.areAllPlayersSubmittedCurrentRound;
  const precision = settingsStore.timerPrecision;

  // My solves sorted newest first (for ao5/ao12 and previous solves display)
  const myAllSolves = (() => {
    const myId = roomStore.playerId;
    if (!myId) return [];
    return roomStore.solves
      .filter(s => s.playerId === myId)
      .sort((a, b) => b.round - a.round);
  })();
  const ao5 = calculateAverage(myAllSolves, 5, 2);
  const ao12 = calculateAverage(myAllSolves, 12, 3);

  // Previous solves for display below timer (my solves from past rounds, newest first)
  const previousSolves = (() => {
    const myId = roomStore.playerId;
    if (!myId) return [];
    const mySolves = roomStore.solves
      .filter(s => s.playerId === myId && s.round < roomStore.currentRound)
      .sort((a, b) => b.round - a.round);
    // If current round solve is shown as "YOUR TIME", exclude it and show previous ones
    if (mySolve && roomStore.hasSubmittedCurrentRound) {
      return mySolves.slice(0, 4);
    }
    return mySolves.slice(0, 4);
  })();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: useMobileLayout ? 'column' : 'row',
        ...vhSafe(100),
        maxWidth: useMobileLayout ? '100%' : 1400,
        mx: 'auto',
        width: '100%',
        overflow: 'hidden',
      }}>
      {useMobileLayout ? (
        <MobileRoomLayout
          onColorStart={handleColorStart}
          onTouchStart={touchHandlers.onTouchStart}
          onTouchEnd={touchHandlers.onTouchEnd}
          onOpenSettings={() => setSettingsOpen(true)}
          onLeave={handleLeave}
          onCopyCode={handleCopyCode}
          isTimerDisabled={isTimerDisabled}
        />
      ) : (
        <>
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

          <Box sx={{ p: 2, pt: 0, flexShrink: 0 }}>
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
        {/* Reconnecting banner */}
        {roomStore.isReconnecting && (
          <Box
            sx={{
              px: 2,
              py: 0.75,
              bgcolor: 'rgba(244, 67, 54, 0.15)',
              borderBottom: '1px solid',
              borderColor: 'rgba(244, 67, 54, 0.3)',
              textAlign: 'center',
            }}>
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#f44336',
                letterSpacing: '0.05em',
              }}>
              {t('room.reconnecting')}
            </Typography>
          </Box>
        )}

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
                onClick={() => setSettingsOpen(true)}
                title={t('settings.title')}>
                <SettingsIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleLeave}
                title={t('room.leave')}
                sx={{ color: 'error.main' }}>
                <MeetingRoomIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
          </Box>
        )}

        {/* Scramble + Timer area — full touch target */}
        <Box
          onTouchStart={touchHandlers.onTouchStart}
          onTouchEnd={touchHandlers.onTouchEnd}
          sx={{
            flex: isTimerRunning ? 1 : '0 1 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 1, md: 2 },
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
            userSelect: 'none',
            cursor: 'pointer',
          }}>
          {!isTimerRunning &&
            (shouldShowWaitingState ? (
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography sx={{ ...LABEL_SX, mb: 0.5 }}>
                  {t('room.waitingForPlayers', {
                    count: roomStore.remainingPlayersCountCurrentRound,
                  })}
                </Typography>
              </Box>
            ) : (
              <ScrambleDisplay
                scramble={roomStore.currentScramble}
                eventId={roomStore.eventId}
                onManualTime={ms => {
                  if (!roomStore.hasSubmittedCurrentRound) {
                    roomStore.submitTime(ms, false);
                  }
                }}
              />
            ))}

          {/* Stats bar (rolling averages) */}
          {!isTimerRunning && myAllSolves.length > 0 && (
            <Stack direction="row" spacing={3}>
              <Typography sx={{ ...LABEL_SX, fontSize: '1.3rem' }}>
                ao5: {formatAverage(ao5, precision)}
              </Typography>
              <Typography sx={{ ...LABEL_SX, fontSize: '1.3rem' }}>
                ao12: {formatAverage(ao12, precision)}
              </Typography>
            </Stack>
          )}

          {roomStore.hasSubmittedCurrentRound && mySolve ? (
            <Box sx={{ textAlign: 'center' }}>
              {(() => {
                const timeStr = getDisplayTime(mySolve);
                const dotIdx = timeStr.lastIndexOf('.');
                const intPart = dotIdx >= 0 ? timeStr.slice(0, dotIdx) : timeStr;
                const decPart = dotIdx >= 0 ? timeStr.slice(dotIdx) : '';
                const timeSx = {
                  fontFamily: '"Inter", monospace',
                  fontSize: 'clamp(3rem, 12vw, 8rem)',
                  fontWeight: 900,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  userSelect: 'none',
                } as const;
                return (
                  <Typography sx={{ ...timeSx, color: 'text.primary' }}>
                    {intPart}
                    <Typography component="span" sx={{ ...timeSx, color: 'primary.main', fontSize: 'inherit' }}>
                      {decPart}
                    </Typography>
                  </Typography>
                );
              })()}
            </Box>
          ) : (
            <Timer disabled={isTimerDisabled} onColorStart={handleColorStart} />
          )}

          {/* Previous solves stack */}
          {!isTimerRunning && previousSolves.length > 0 && (
            <Box sx={{ textAlign: 'center', mt: 1, overflow: 'hidden' }}>
              {previousSolves.map((solve, i) => (
                <Typography
                  key={solve.id}
                  sx={{
                    fontFamily: 'monospace',
                    fontVariantNumeric: 'tabular-nums',
                    fontSize: `clamp(${0.8 - i * 0.1}rem, ${2.4 - i * 0.35}vw, ${2.4 - i * 0.35}rem)`,
                    fontWeight: 600,
                    color: 'text.secondary',
                    opacity: 0.5 - i * 0.08,
                    lineHeight: 1.5,
                    userSelect: 'none',
                  }}>
                  {getDisplayTime(solve, precision)}
                </Typography>
              ))}
            </Box>
          )}
        </Box>

        {/* Results history — header sits in its own row so it stays put when
            the table scrolls horizontally on narrow viewports. */}
        {!isTimerRunning && (
          <Box
            sx={{
              flex: '1 1 0',
              minHeight: 150,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                py: 1,
                bgcolor: 'background.default',
                flexShrink: 0,
              }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography
                  sx={{
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    color: 'text.secondary',
                  }}>
                  {t('room.history')}
                </Typography>
                {myAllSolves.length > 0 && (() => {
                  const worst = Math.max(...myAllSolves.map(s => s.penalty === 'DNF' ? 0 : s.penalty === '+2' ? s.time + 2000 : s.time));
                  return worst > 0 ? (
                    <Typography
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.65rem',
                        color: 'text.secondary',
                      }}>
                      Worst: {formatTime(worst, precision)}
                    </Typography>
                  ) : null;
                })()}
                {roomStore.getGlobalAverage(roomStore.playerId ?? '') !== null && (
                  <Typography
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.65rem',
                      color: 'text.secondary',
                    }}>
                    Avg: {formatTime(roomStore.getGlobalAverage(roomStore.playerId ?? '')!, precision)}
                  </Typography>
                )}
              </Stack>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              <ResultsTable />
            </Box>
          </Box>
        )}
      </Box>
        </>
      )}

      {/* Settings dialog */}
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* PB notification */}
      <Snackbar
        open={!!pbSnack}
        autoHideDuration={3000}
        onClose={handlePbSnackClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={
          pbSnack && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ flex: 1 }} />
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: 'primary.main',
                }}>
                {pbSnack.isSelf
                  ? t('room.pbSelf', { time: pbSnack.time })
                  : t('room.pbOther', {
                      name: pbSnack.playerName,
                      time: pbSnack.time,
                    })}
              </Typography>
              <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton
                  size="small"
                  onClick={handlePbSnackClose}
                  sx={{ p: 0.25, color: 'text.secondary' }}>
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            </Box>
          )
        }
        slotProps={{
          content: {
            sx: {
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'primary.main',
              borderRadius: 2,
              boxShadow: '0 0 16px rgba(255, 105, 180, 0.25), 0 0 4px rgba(255, 105, 180, 0.15)',
              '& .MuiSnackbarContent-message': { width: '100%', p: 0 },
            },
          },
        }}
      />
    </Box>
  );
});

export default RoomScreen;
