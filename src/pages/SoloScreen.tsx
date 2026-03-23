import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
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
  const isTimerActive = timerStore.timerPhase === 'running' || timerStore.timerPhase === 'ready';

  const handleColorStart = useCallback((color: CrossColor) => {
    pendingColorRef.current = color;
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
              onClick={e => setCompetAnchor(e.currentTarget)}
              sx={{
                ml: 1,
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
          />
        )}

        {/* Stats bar */}
        {!isTimerRunning && soloStore.eventSolves.length > 0 && (
          <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
            <Typography sx={{ ...LABEL_SX, fontSize: '0.65rem' }}>
              {t('room.best')}: {soloStore.bestTime !== null ? formatTime(soloStore.bestTime) : '-'}
            </Typography>
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
    </Box>
  );
});

export default SoloScreen;
