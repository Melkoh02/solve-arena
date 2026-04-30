import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Box, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../../lib/hooks/useStore';
import { useScramblePreviewShortcut } from '../../../lib/hooks/useScramblePreviewShortcut';
import { getDisplayTime } from '../../../lib/utils/formatTime';
import { calculateAverage, formatAverage } from '../../../lib/utils/averages';
import Timer from '../../timer/Timer';
import MobileScramblePanel from '../../solo/mobile/MobileScramblePanel';
import ScrambleActionSheet from '../../solo/mobile/ScrambleActionSheet';
import MobileRoomTopBar from './MobileRoomTopBar';
import RoomSidebarSheet from './RoomSidebarSheet';
import MobileResultsDrawer from './MobileResultsDrawer';
import type { CrossColor } from '../../../lib/types/room';

const PREVIEW_KEY = 'scramblePreviewVisible';

export interface MobileRoomLayoutProps {
  onColorStart: (color: CrossColor) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onOpenSettings: () => void;
  onLeave: () => void;
  onShareInvite: () => void;
  isTimerDisabled: boolean;
}

const MobileRoomLayout = observer(function MobileRoomLayout({
  onColorStart,
  onTouchStart,
  onTouchEnd,
  onOpenSettings,
  onLeave,
  onShareInvite,
  isTimerDisabled,
}: MobileRoomLayoutProps) {
  const { roomStore, settingsStore, timerStore } = useStore();
  const { t } = useTranslation();
  const precision = settingsStore.timerPrecision;
  const isTimerRunning = timerStore.timerPhase === 'running';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [scrambleSheetOpen, setScrambleSheetOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(() => {
    try {
      return localStorage.getItem(PREVIEW_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== PREVIEW_KEY) return;
      setShowPreview(e.newValue === 'true');
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const togglePreview = () => {
    setShowPreview(prev => {
      const next = !prev;
      try {
        localStorage.setItem(PREVIEW_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Wire the configurable scramble-preview shortcut. The desktop
  // ScrambleDisplay registers the same hook; only one is mounted at a time.
  useScramblePreviewShortcut(setShowPreview, PREVIEW_KEY);

  const mySolve = roomStore.myCurrentRoundSolve;
  const myAllSolves = (() => {
    const myId = roomStore.playerId;
    if (!myId) return [];
    return roomStore.solves
      .filter(s => s.playerId === myId)
      .sort((a, b) => b.round - a.round);
  })();
  const ao5 = calculateAverage(myAllSolves, 5, 2);
  const ao12 = calculateAverage(myAllSolves, 12, 3);

  const previousSolves = (() => {
    const myId = roomStore.playerId;
    if (!myId) return [];
    return roomStore.solves
      .filter(s => s.playerId === myId && s.round < roomStore.currentRound)
      .sort((a, b) => b.round - a.round)
      .slice(0, 4);
  })();

  const shouldShowWaitingState =
    roomStore.isWaitingForOtherPlayers &&
    !isTimerRunning &&
    !roomStore.areAllPlayersSubmittedCurrentRound;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
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
            flexShrink: 0,
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

      {!isTimerRunning && (
        <MobileRoomTopBar
          roomCode={roomStore.roomCode ?? ''}
          playerCount={roomStore.players.length}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenSettings={onOpenSettings}
          onLeave={onLeave}
          onShareInvite={onShareInvite}
        />
      )}

      {!isTimerRunning && (
        <Box sx={{ px: 1.5, pt: 1 }}>
          {shouldShowWaitingState ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography
                sx={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'text.secondary',
                }}>
                {t('room.waitingForPlayers', {
                  count: roomStore.remainingPlayersCountCurrentRound,
                })}
              </Typography>
            </Box>
          ) : (
            <MobileScramblePanel
              scramble={roomStore.currentScramble}
              eventId={roomStore.eventId}
              isLoading={false}
              isCustom={false}
              showPreview={showPreview}
              onOpenActions={() => setScrambleSheetOpen(true)}
            />
          )}
        </Box>
      )}

      {/* Timer area */}
      <Box
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: 1,
          touchAction: 'none',
          WebkitTapHighlightColor: 'transparent',
          userSelect: 'none',
          cursor: 'pointer',
          minHeight: 0,
        }}>
        {!isTimerRunning && myAllSolves.length > 0 && (
          <Stack direction="row" spacing={2.5} sx={{ mb: 1 }}>
            <Typography
              sx={{
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'text.secondary',
              }}>
              ao5: {formatAverage(ao5, precision)}
            </Typography>
            <Typography
              sx={{
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'text.secondary',
              }}>
              ao12: {formatAverage(ao12, precision)}
            </Typography>
          </Stack>
        )}

        {/* Already-submitted display: render the submitted time in the same
            big-typography style as the Timer, without the timing flow. */}
        {roomStore.hasSubmittedCurrentRound && mySolve ? (
          <SubmittedTimeDisplay timeStr={getDisplayTime(mySolve)} />
        ) : (
          <Timer disabled={isTimerDisabled} onColorStart={onColorStart} large />
        )}

        {!isTimerRunning && previousSolves.length > 0 && (
          <Box sx={{ textAlign: 'center', overflow: 'hidden', mt: 1 }}>
            {previousSolves.map((solve, i) => (
              <Typography
                key={solve.id}
                sx={{
                  fontFamily: 'monospace',
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: `${1.85 - i * 0.18}rem`,
                  fontWeight: 600,
                  color: 'text.secondary',
                  opacity: 0.55 - i * 0.08,
                  lineHeight: 1.35,
                  userSelect: 'none',
                }}>
                {getDisplayTime(solve, precision)}
              </Typography>
            ))}
          </Box>
        )}

        {isTimerRunning && (
          <Typography
            sx={{
              position: 'absolute',
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
              left: 0,
              right: 0,
              textAlign: 'center',
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'text.secondary',
              opacity: 0.6,
              pointerEvents: 'none',
            }}>
            {t('settings.tapToStop')}
          </Typography>
        )}
      </Box>

      {/* Bottom history drawer (only after at least one completed round) */}
      {!isTimerRunning && (
        <MobileResultsDrawer
          open={historyOpen}
          onOpen={() => setHistoryOpen(true)}
          onClose={() => setHistoryOpen(false)}
        />
      )}

      {/* Sidebar bottom sheet — opened via the burger menu */}
      <RoomSidebarSheet
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLeave={() => {
          setSidebarOpen(false);
          onLeave();
        }}
        onShareInvite={onShareInvite}
      />

      {/* Scramble actions — multiplayer omits "edit scramble" since the
          server controls scrambles per round. Manual time only submits
          when not already submitted, matching the desktop behavior. */}
      <ScrambleActionSheet
        open={scrambleSheetOpen}
        onClose={() => setScrambleSheetOpen(false)}
        showPreview={showPreview}
        onTogglePreview={togglePreview}
        onManualTime={ms => {
          if (!roomStore.hasSubmittedCurrentRound) {
            roomStore.submitTime(ms, false);
          }
        }}
      />
    </Box>
  );
});

function SubmittedTimeDisplay({ timeStr }: { timeStr: string }) {
  const dotIdx = timeStr.lastIndexOf('.');
  const intPart = dotIdx >= 0 ? timeStr.slice(0, dotIdx) : timeStr;
  const decPart = dotIdx >= 0 ? timeStr.slice(dotIdx) : '';
  const baseSx = {
    fontFamily: '"Inter", monospace',
    fontSize: 'clamp(5.5rem, 28vw, 10rem)',
    fontWeight: 900,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1,
    letterSpacing: '-0.02em',
    userSelect: 'none',
  } as const;
  return (
    <Typography sx={{ ...baseSx, color: 'text.primary' }}>
      {intPart}
      <Typography
        component="span"
        sx={{ ...baseSx, color: 'primary.main', fontSize: 'inherit' }}>
        {decPart}
      </Typography>
    </Typography>
  );
}

export default MobileRoomLayout;
