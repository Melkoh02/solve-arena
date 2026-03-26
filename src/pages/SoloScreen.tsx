import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Stack,
  Typography,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GroupsIcon from '@mui/icons-material/Groups';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { observer } from 'mobx-react-lite';
import { reaction } from 'mobx';
import { useTranslation } from 'react-i18next';
import { useStore } from '../lib/hooks/useStore';
import ScrambleDisplay from '../components/timer/ScrambleDisplay';
import Timer, { useTimerTouch } from '../components/timer/Timer';
import PuzzleSelector from '../components/timer/PuzzleSelector';
import JoinRoomPopover from '../components/room/JoinRoomDialog';
import ServerStatusDot from '../components/room/ServerStatusDot';
import SoloHistory from '../components/solo/SoloHistory';
import SoloSolveDetailModal from '../components/solo/SoloSolveDetailModal';
import AverageDetailModal from '../components/solo/AverageDetailModal';
import LanguageSelect from '../components/organisims/LanguageSelect';
import { formatTime, getDisplayTime } from '../lib/utils/formatTime';
import { formatAverage } from '../lib/utils/averages';
import type { SoloSolve } from '../lib/stores/soloStore';
import type { CrossColor } from '../lib/types/room';

const LABEL_SX = {
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  fontSize: '0.6rem',
  fontWeight: 700,
  color: 'text.secondary',
} as const;

const SoloScreen = observer(function SoloScreen() {
  const { timerStore, soloStore, themeStore } = useStore();
  const { t } = useTranslation();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const [competAnchor, setCompetAnchor] = useState<HTMLElement | null>(null);
  const [selectedSolve, setSelectedSolve] = useState<SoloSolve | null>(null);
  const [aoSolves, setAoSolves] = useState<SoloSolve[] | null>(null);
  const [aoSize, setAoSize] = useState(5);
  const pendingColorRef = useRef<CrossColor>('w');

  const isTimerRunning = timerStore.timerPhase === 'running';
  const isTimerActive = timerStore.timerPhase === 'running' || timerStore.timerPhase === 'ready' || timerStore.timerPhase === 'preparing';

  const handleColorStart = useCallback((color: CrossColor) => {
    // Check phase via direct access (not reactive dependency)
    const phase = timerStore.timerPhase;
    if (phase === 'running') {
      pendingColorRef.current = color;
    } else {
      const last = soloStore.lastSolve;
      if (last) soloStore.updateCrossColor(last.id, color);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const touchHandlers = useTimerTouch(false, handleColorStart);

  // Submit solve when timer stops
  useEffect(
    () =>
      reaction(
        () => timerStore.timerPhase,
        phase => {
          if (phase === 'stopped' && timerStore.displayTime > 0) {
            soloStore.addSolve(timerStore.displayTime, timerStore.lastStopWasDnf, pendingColorRef.current);
            pendingColorRef.current = 'w';
          }
        },
      ),
    [timerStore, soloStore],
  );

  // Delete shortcuts: Backspace/Delete = delete last solve, Ctrl+Shift+Backspace/Delete = clear all
  const [deleteConfirm, setDeleteConfirm] = useState<'last' | 'all' | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isTimerActive) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        if (e.ctrlKey && e.shiftKey) {
          if (soloStore.eventSolves.length > 0) setDeleteConfirm('all');
        } else {
          if (soloStore.lastSolve) setDeleteConfirm('last');
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [soloStore, isTimerActive]);

  const lastSolve = soloStore.lastSolve;
  const showActions = timerStore.timerPhase === 'stopped' && lastSolve;

  // When timer shows the last solve time (stopped), exclude it from the stack.
  // When timer is idle/ready (0.00), show all recent solves including the last.
  const timerShowsLastSolve = timerStore.timerPhase === 'stopped';
  const previousSolves = (() => {
    const es = soloStore.eventSolves;
    if (es.length === 0) return [];
    if (timerShowsLastSolve) {
      if (es.length < 2) return [];
      return es.slice(-5, -1).reverse();
    }
    return es.slice(-5).reverse();
  })();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        maxWidth: 1000,
        mx: 'auto',
        width: '100%',
        overflow: 'hidden',
      }}>
      {/* ── Top bar ─────────────────────────────────────────── */}
      {!isTimerRunning && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 1.5, md: 3 },
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
          }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <PuzzleSelector
              value={soloStore.eventId}
              onChange={id => soloStore.changeEvent(id)}
            />
          </Stack>
          <Typography
            sx={{
              color: 'primary.main',
              fontWeight: 900,
              fontSize: { xs: '0.85rem', md: '1rem' },
              letterSpacing: '-0.02em',
              display: { xs: 'none', sm: 'block' },
            }}>
            Solve Arena
          </Typography>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <IconButton
              size="small"
              onClick={themeStore.toggle}
              title={t('settings.toggleTheme')}>
              {themeStore.scheme === 'dark' ? (
                <LightModeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              ) : (
                <DarkModeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              )}
            </IconButton>
            <LanguageSelect />
            <Button
              variant="outlined"
              size="small"
              startIcon={!isMobile ? <GroupsIcon sx={{ fontSize: 18 }} /> : undefined}
              endIcon={<ServerStatusDot />}
              onClick={e => setCompetAnchor(e.currentTarget)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.75rem',
                borderColor: 'primary.main',
                color: 'primary.main',
                minWidth: isMobile ? 36 : undefined,
              }}>
              {isMobile ? <GroupsIcon sx={{ fontSize: 18 }} /> : t('lobby.compete')}
            </Button>
          </Stack>
        </Box>
      )}

      {/* ── Timer area ─────────────────────────────────────── */}
      <Box
        onTouchStart={touchHandlers.onTouchStart}
        onTouchEnd={touchHandlers.onTouchEnd}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 1, md: 2 },
          // When running: expand to fill screen and center timer
          // When not running: shrink to content so history fills the rest
          flex: isTimerRunning ? 1 : '0 0 auto',
          touchAction: 'none',
          WebkitTapHighlightColor: 'transparent',
          cursor: 'pointer',
        }}>
        {/* Scramble */}
        {!isTimerRunning && (
          <ScrambleDisplay
            scramble={soloStore.currentScramble}
            eventId={soloStore.eventId}
            isLoading={soloStore.isLoadingScramble}
            isCustom={soloStore.isCustomScramble}
            onSetCustom={s => soloStore.setCustomScramble(s)}
            onClearCustom={() => soloStore.clearCustomScramble()}
            onManualTime={ms => soloStore.addManualSolve(ms)}
          />
        )}

        {/* Stats bar (rolling averages) */}
        {!isTimerRunning && soloStore.eventSolves.length > 0 && (
          <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
            <Typography sx={{ ...LABEL_SX, fontSize: '0.65rem' }}>
              ao5: {formatAverage(soloStore.ao5)}
            </Typography>
            <Typography sx={{ ...LABEL_SX, fontSize: '0.65rem' }}>
              ao12: {formatAverage(soloStore.ao12)}
            </Typography>
          </Stack>
        )}

        {/* Timer */}
        <Timer disabled={false} onColorStart={handleColorStart} />

        {/* Previous solves stack (quick glance) */}
        {!isTimerRunning && previousSolves.length > 0 && (
          <Box sx={{ textAlign: 'center' }}>
            {previousSolves.map((solve, i) => (
              <Typography
                key={solve.id}
                sx={{
                  fontFamily: 'monospace',
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: `${2.4 - i * 0.35}rem`,
                  fontWeight: 600,
                  color: 'text.secondary',
                  opacity: 0.5 - i * 0.08,
                  lineHeight: 1.7,
                  userSelect: 'none',
                }}>
                {getDisplayTime(solve)}
              </Typography>
            ))}
          </Box>
        )}
      </Box>

      {/* ── History table (fills remaining space) ───────────── */}
      {!isTimerRunning && soloStore.eventSolves.length > 0 && (
        <Box
          sx={{
            flex: '1 1 0',
            minHeight: 0,
            borderTop: '1px solid',
            borderColor: 'divider',
            overflowY: 'auto',
          }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: { xs: 1.5, sm: 2, md: 3 },
              pt: 1,
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
                {t('room.history')} ({soloStore.eventSolves.length})
              </Typography>
              {soloStore.bestTime !== null && (
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'text.secondary' }}>
                  {t('room.best')}: {formatTime(soloStore.bestTime)}
                </Typography>
              )}
              {soloStore.globalAverage !== null && (
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'text.secondary' }}>
                  Avg: {formatTime(soloStore.globalAverage)}
                </Typography>
              )}
            </Stack>
            <IconButton
              size="small"
              onClick={() => soloStore.clearSolves()}
              title={t('room.resetRoom')}
              sx={{ color: 'text.secondary', p: 0.25 }}>
              <DeleteOutlineIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
          <SoloHistory
            onSelectSolve={setSelectedSolve}
            onSelectAo={(solves, size) => {
              setAoSolves(solves);
              setAoSize(size);
            }}
          />
        </Box>
      )}

      {/* Compete popover */}
      <JoinRoomPopover
        anchorEl={competAnchor}
        onClose={() => setCompetAnchor(null)}
      />

      {/* Solve detail modal */}
      <SoloSolveDetailModal
        solve={selectedSolve}
        onClose={() => setSelectedSolve(null)}
      />

      {/* Average detail modal */}
      <AverageDetailModal
        solves={aoSolves}
        size={aoSize}
        onClose={() => setAoSolves(null)}
      />

      {/* Delete confirmation dialog (keyboard shortcuts) */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (deleteConfirm === 'all') soloStore.clearSolves();
            else soloStore.deleteLastSolve();
            setDeleteConfirm(null);
          }
        }}
        maxWidth="xs"
        slotProps={{
          paper: {
            sx: {
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              backgroundImage: 'none',
            },
          },
        }}>
        <DialogTitle sx={{ pb: 0.5, fontSize: '0.95rem', fontWeight: 700 }}>
          {deleteConfirm === 'all' ? t('solo.clearAll') : t('solo.deleteSolve')}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
            {deleteConfirm === 'all'
              ? t('solo.clearAllConfirm')
              : t('solo.deleteSolveConfirm', { time: lastSolve ? getDisplayTime(lastSolve) : '' })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            size="small"
            onClick={() => setDeleteConfirm(null)}
            sx={{ textTransform: 'none' }}>
            {t('common.cancel')}
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={() => {
              if (deleteConfirm === 'all') {
                soloStore.clearSolves();
              } else {
                soloStore.deleteLastSolve();
              }
              setDeleteConfirm(null);
            }}
            sx={{ textTransform: 'none' }}>
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* PB notification */}
      <Snackbar
        open={!!soloStore.pbNotification}
        autoHideDuration={3000}
        onClose={() => soloStore.clearPbNotification()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={
          soloStore.pbNotification && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ flex: 1 }} />
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: 'primary.main',
                }}>
                {t('room.pbSelf', { time: soloStore.pbNotification })}
              </Typography>
              <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton
                  size="small"
                  onClick={() => soloStore.clearPbNotification()}
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

export default SoloScreen;
