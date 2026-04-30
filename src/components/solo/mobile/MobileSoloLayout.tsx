import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../../lib/hooks/useStore';
import { useScramblePreviewShortcut } from '../../../lib/hooks/useScramblePreviewShortcut';
import { getDisplayTime } from '../../../lib/utils/formatTime';
import { formatAverage } from '../../../lib/utils/averages';
import Timer from '../../timer/Timer';
import type { CrossColor } from '../../../lib/types/room';
import type { SoloSolve } from '../../../lib/stores/soloStore';
import MobileTopBar from './MobileTopBar';
import MobileScramblePanel from './MobileScramblePanel';
import ScrambleActionSheet from './ScrambleActionSheet';
import HistoryDrawer from './HistoryDrawer';

const PREVIEW_KEY = 'scramblePreviewVisible';

export interface MobileSoloLayoutProps {
  onColorStart: (color: CrossColor) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onOpenSettings: () => void;
  onOpenCompete: (anchor: HTMLElement) => void;
  competeButtonRef?: React.Ref<HTMLButtonElement>;
  onSelectSolve: (solve: SoloSolve) => void;
  onRequestClearAll: () => void;
  previousSolves: SoloSolve[];
}

const MobileSoloLayout = observer(function MobileSoloLayout({
  onColorStart,
  onTouchStart,
  onTouchEnd,
  onOpenSettings,
  onOpenCompete,
  competeButtonRef,
  onSelectSolve,
  onRequestClearAll,
  previousSolves,
}: MobileSoloLayoutProps) {
  const { t } = useTranslation();
  const { timerStore, soloStore, settingsStore } = useStore();
  const precision = settingsStore.timerPrecision;
  const isTimerRunning = timerStore.timerPhase === 'running';

  const [scrambleSheetOpen, setScrambleSheetOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteLastTarget, setDeleteLastTarget] = useState<SoloSolve | null>(
    null,
  );
  const [showPreview, setShowPreview] = useState(() => {
    try {
      return localStorage.getItem(PREVIEW_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Keep preview state in sync with localStorage (the desktop ScrambleDisplay
  // also writes to this key — read on mount and listen for changes triggered
  // from the keyboard shortcut path).
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

  // 3-finger tap on the timer area requests deletion of the most recent
  // solve. Wraps the timer touch handler: the first finger already armed
  // the timer (preparing/ready/inspecting), so we cancel that state when we
  // detect the gesture. Only fires before the timer starts running — once
  // a real solve is in progress we leave the touch flow alone.
  const handleTouchStart = (e: React.TouchEvent) => {
    if (
      e.touches.length >= 3 &&
      (timerStore.timerPhase === 'idle' ||
        timerStore.timerPhase === 'stopped' ||
        timerStore.timerPhase === 'preparing' ||
        timerStore.timerPhase === 'ready' ||
        timerStore.timerPhase === 'inspecting')
    ) {
      e.preventDefault();
      timerStore.resetToIdle();
      const last = soloStore.lastSolve;
      if (last) setDeleteLastTarget(last);
      return;
    }
    onTouchStart(e);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
      }}>
      {!isTimerRunning && (
        <MobileTopBar
          eventId={soloStore.eventId}
          onChangePuzzle={id => soloStore.changeEvent(id)}
          onOpenSettings={onOpenSettings}
          onOpenCompete={onOpenCompete}
          competeButtonRef={competeButtonRef}
        />
      )}

      {!isTimerRunning && (
        <Box sx={{ px: 1.5, pt: 1 }}>
          <MobileScramblePanel
            scramble={soloStore.currentScramble}
            eventId={soloStore.eventId}
            isLoading={soloStore.isLoadingScramble}
            isCustom={soloStore.isCustomScramble}
            showPreview={showPreview}
            onOpenActions={() => setScrambleSheetOpen(true)}
            onPrevScramble={() => soloStore.prevScramble()}
            onNextScramble={() => soloStore.nextScramble()}
            canPrevScramble={soloStore.canPrevScramble}
            canNextScramble={soloStore.canNextScramble}
          />
        </Box>
      )}

      {/* Timer area — fills remaining space, full-screen when running */}
      <Box
        onTouchStart={handleTouchStart}
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
        {!isTimerRunning && soloStore.eventSolves.length > 0 && (
          <Stack direction="row" spacing={2.5} sx={{ mb: 1 }}>
            <Typography
              sx={{
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'text.secondary',
              }}>
              ao5: {formatAverage(soloStore.ao5, precision)}
            </Typography>
            <Typography
              sx={{
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'text.secondary',
              }}>
              ao12: {formatAverage(soloStore.ao12, precision)}
            </Typography>
          </Stack>
        )}

        <Timer disabled={false} onColorStart={onColorStart} large />

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
            {/* Hint kept subtle so it doesn't compete with the timer */}
            {t('settings.tapToStop')}
          </Typography>
        )}
      </Box>

      {/* History drawer (peek bar at bottom + expandable drawer) */}
      {!isTimerRunning && soloStore.eventSolves.length > 0 && (
        <HistoryDrawer
          open={historyOpen}
          onOpen={() => setHistoryOpen(true)}
          onClose={() => setHistoryOpen(false)}
          onRequestClearAll={onRequestClearAll}
          onSelectSolve={onSelectSolve}
        />
      )}

      {/* Scramble action sheet */}
      <ScrambleActionSheet
        open={scrambleSheetOpen}
        onClose={() => setScrambleSheetOpen(false)}
        showPreview={showPreview}
        onTogglePreview={togglePreview}
        onSetCustomScramble={s => soloStore.setCustomScramble(s)}
        onManualTime={ms => soloStore.addManualSolve(ms)}
      />

      {/* 3-finger-tap delete confirmation. Same shape as the per-solve
          confirmation in HistoryDrawer; kept inline so the timer-area
          gesture can request a delete without going through the drawer. */}
      <Dialog
        open={!!deleteLastTarget}
        onClose={() => setDeleteLastTarget(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              backgroundImage: 'none',
              mx: 2,
            },
          },
        }}>
        <DialogTitle sx={{ pb: 0.5, fontSize: '1.05rem', fontWeight: 700 }}>
          {t('solo.deleteSolve')}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.95rem', color: 'text.secondary' }}>
            {t('solo.deleteSolveConfirm', {
              time: deleteLastTarget
                ? getDisplayTime(deleteLastTarget, precision)
                : '',
            })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setDeleteLastTarget(null)}
            sx={{ textTransform: 'none', minWidth: 96 }}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (deleteLastTarget) soloStore.deleteSolve(deleteLastTarget.id);
              setDeleteLastTarget(null);
            }}
            sx={{ textTransform: 'none', minWidth: 96 }}>
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default MobileSoloLayout;
