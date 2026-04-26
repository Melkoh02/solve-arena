import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  ButtonBase,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../../lib/hooks/useStore';
import { formatTime } from '../../../lib/utils/formatTime';
import { vhSafe } from '../../../lib/utils/viewport';
import MobileResultsList from './MobileResultsList';

const PEEK_HEIGHT = 56;

export interface MobileResultsDrawerProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const MobileResultsDrawer = observer(function MobileResultsDrawer({
  open,
  onOpen,
  onClose,
}: MobileResultsDrawerProps) {
  const { roomStore, settingsStore } = useStore();
  const { t } = useTranslation();
  const precision = settingsStore.timerPrecision;
  // Callback ref backed by useState so MobileResultsList's IO effect re-runs
  // the moment the scroll container actually mounts (Drawer's lazy paper
  // rendering can put ref population after the child's effect).
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);

  // My solves to compute "Worst" / "Avg" labels for the peek (matches desktop history header)
  const mySolves = (() => {
    const myId = roomStore.playerId;
    if (!myId) return [];
    return roomStore.solves.filter(s => s.playerId === myId);
  })();

  const worst =
    mySolves.length > 0
      ? Math.max(
          ...mySolves.map(s =>
            s.penalty === 'DNF'
              ? 0
              : s.penalty === '+2'
                ? s.time + 2000
                : s.time,
          ),
        )
      : 0;

  const avg = roomStore.playerId
    ? roomStore.getGlobalAverage(roomStore.playerId)
    : null;

  // Don't render anything until at least one round has results
  const completedRoundsCount = new Set(
    roomStore.solves
      .filter(s => s.round < roomStore.currentRound)
      .map(s => s.round),
  ).size;
  if (completedRoundsCount === 0) return null;

  return (
    <>
      {/* Peek bar at the bottom */}
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
        <Stack
          direction="row"
          spacing={1.25}
          alignItems="center"
          sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              fontSize: '0.65rem',
              fontWeight: 700,
              color: 'text.secondary',
            }}>
            {t('room.history')}
          </Typography>
          {worst > 0 && (
            <Typography
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.7rem',
                color: 'text.secondary',
              }}>
              Worst: {formatTime(worst, precision)}
            </Typography>
          )}
          {avg !== null && (
            <Typography
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.7rem',
                color: 'text.secondary',
              }}>
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
            },
          },
        }}>
        {/* Inner wrapper uses CSS grid with minmax(0, 1fr) for the cards
            row — see HistoryDrawer.tsx for the rationale. */}
        <Box
          sx={{
            ...vhSafe(85),
            display: 'grid',
            gridTemplateRows: 'auto auto minmax(0, 1fr)',
            overflow: 'hidden',
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
            <Stack
              direction="row"
              spacing={1.25}
              alignItems="center"
              sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'text.secondary',
                }}>
                {t('room.history')}
              </Typography>
              {worst > 0 && (
                <Typography
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    color: 'text.secondary',
                  }}>
                  Worst: {formatTime(worst, precision)}
                </Typography>
              )}
              {avg !== null && (
                <Typography
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    color: 'text.secondary',
                  }}>
                  Avg: {formatTime(avg, precision)}
                </Typography>
              )}
            </Stack>
            <IconButton
              size="medium"
              onClick={onClose}
              aria-label={t('common.cancel')}
              sx={{ color: 'text.secondary', p: 0.875 }}>
              <CloseIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Box>

          {/* Round cards — pill style matching solo's HistoryCard, with
            per-player mini-cells inside each card. Horizontal scroll for
            wide rooms; vertical scroll for many rounds. */}
          <Box
            ref={setScrollEl}
            sx={{
              minHeight: 0,
              overflow: 'auto',
              overscrollBehavior: 'contain',
              pb: 2,
            }}>
            <MobileResultsList scrollEl={scrollEl} />
          </Box>
        </Box>
      </Drawer>
    </>
  );
});

export default MobileResultsDrawer;
