import { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Button,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../../lib/hooks/useStore';
import { formatTime, getDisplayTime } from '../../../lib/utils/formatTime';
import HistoryCard from './HistoryCard';
import type { SoloSolve } from '../../../lib/stores/soloStore';

const PEEK_HEIGHT = 56;
const PAGE_SIZE = 30;

export interface HistoryDrawerProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onRequestClearAll: () => void;
  onSelectSolve: (solve: SoloSolve) => void;
}

const HistoryDrawer = observer(function HistoryDrawer({
  open,
  onOpen,
  onClose,
  onRequestClearAll,
  onSelectSolve,
}: HistoryDrawerProps) {
  const { soloStore, settingsStore } = useStore();
  const { t } = useTranslation();
  const precision = settingsStore.timerPrecision;
  const [deleteTarget, setDeleteTarget] = useState<SoloSolve | null>(null);
  const count = soloStore.eventSolves.length;
  const best = soloStore.bestTime;
  const avg = soloStore.globalAverage;

  const [visible, setVisible] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Most-recent first
  const orderedSolves = [...soloStore.eventSolves].reverse();
  const visibleSolves = orderedSolves.slice(0, visible);

  // Reset paging when drawer reopens or count changes drastically
  useEffect(() => {
    if (!open) setVisible(PAGE_SIZE);
  }, [open]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !open) return;
    const io = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          setVisible(prev =>
            prev >= orderedSolves.length ? prev : prev + PAGE_SIZE,
          );
        }
      },
      { threshold: 0.1 },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [open, orderedSolves.length]);

  return (
    <>
      {/* Peek bar at the bottom — tap to open */}
      <ButtonBase
        onClick={onOpen}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          width: '100%',
          height: PEEK_HEIGHT,
          px: 2,
          pb: 'calc(env(safe-area-inset-bottom, 0px) / 2)',
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default',
          flexShrink: 0,
          textAlign: 'left',
        }}>
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              fontSize: '0.65rem',
              fontWeight: 700,
              color: 'text.secondary',
            }}>
            {t('room.history')} ({count})
          </Typography>
          {best !== null && (
            <Typography
              sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'text.secondary' }}>
              {t('room.best')}: {formatTime(best, precision)}
            </Typography>
          )}
          {avg !== null && (
            <Typography
              sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'text.secondary' }}>
              Avg: {formatTime(avg, precision)}
            </Typography>
          )}
        </Stack>
        <KeyboardArrowUpIcon sx={{ color: 'primary.main', fontSize: 22 }} />
      </ButtonBase>

      {/* Full drawer */}
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              bgcolor: 'background.paper',
              backgroundImage: 'none',
              height: '85vh',
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}>
        {/* Drag handle */}
        <Box
          sx={{
            width: 40,
            height: 4,
            bgcolor: 'divider',
            borderRadius: 2,
            mx: 'auto',
            mt: 1,
            mb: 1,
            flexShrink: 0,
          }}
        />

        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
          }}>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'text.secondary',
              }}>
              {t('room.history')} ({count})
            </Typography>
            {best !== null && (
              <Typography
                sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'text.secondary' }}>
                {t('room.best')}: {formatTime(best, precision)}
              </Typography>
            )}
            {avg !== null && (
              <Typography
                sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'text.secondary' }}>
                Avg: {formatTime(avg, precision)}
              </Typography>
            )}
          </Stack>
          <IconButton
            size="small"
            onClick={onRequestClearAll}
            sx={{ color: 'text.secondary' }}
            aria-label={t('solo.clearAll')}>
            <DeleteOutlineIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        {/* Cards */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 1.5,
            py: 1,
            pb: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
          }}>
          <Stack spacing={1}>
            {visibleSolves.map(solve => {
              // index in event-solves array (1-based original order)
              const originalIndex =
                soloStore.eventSolves.findIndex(s => s.id === solve.id) + 1;
              return (
                <HistoryCard
                  key={solve.id}
                  solve={solve}
                  index={originalIndex}
                  onSelect={onSelectSolve}
                  onRequestDelete={setDeleteTarget}
                />
              );
            })}
          </Stack>
          <Box ref={sentinelRef} sx={{ height: 1 }} />
        </Box>
      </Drawer>

      {/* Per-solve delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
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
          {t('solo.deleteSolve')}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
            {t('solo.deleteSolveConfirm', {
              time: deleteTarget ? getDisplayTime(deleteTarget, precision) : '',
            })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            size="small"
            onClick={() => setDeleteTarget(null)}
            sx={{ textTransform: 'none' }}>
            {t('common.cancel')}
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={() => {
              if (deleteTarget) soloStore.deleteSolve(deleteTarget.id);
              setDeleteTarget(null);
            }}
            sx={{ textTransform: 'none' }}>
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

export default HistoryDrawer;
