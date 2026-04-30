import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Button,
  Drawer,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ShareIcon from '@mui/icons-material/Share';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LogoutIcon from '@mui/icons-material/Logout';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../../lib/hooks/useStore';
import { vhSafe } from '../../../lib/utils/viewport';
import { formatTime, getDisplayTime } from '../../../lib/utils/formatTime';
import {
  calculateAverage,
  formatAverage,
  getEffectiveTime,
} from '../../../lib/utils/averages';
import HostControls from '../HostControls';
import type { Player, RoomSolve } from '../../../lib/types/room';

export interface RoomSidebarSheetProps {
  open: boolean;
  onClose: () => void;
  onLeave: () => void;
  onShareInvite: () => void;
}

const RoomSidebarSheet = observer(function RoomSidebarSheet({
  open,
  onClose,
  onLeave,
  onShareInvite,
}: RoomSidebarSheetProps) {
  const { roomStore, settingsStore } = useStore();
  const { t } = useTranslation();
  const precision = settingsStore.timerPrecision;

  // Wins per player — fastest effective time per completed round.
  const winsByPlayer = useMemo(() => {
    const wins = new Map<string, number>();
    const completedRounds = new Set<number>();
    for (const s of roomStore.solves) {
      if (s.round < roomStore.currentRound) completedRounds.add(s.round);
    }
    for (const round of completedRounds) {
      const roundSolves = roomStore.solves.filter(s => s.round === round);
      if (roundSolves.length === 0) continue;
      let bestTime = Infinity;
      for (const s of roundSolves) {
        const eff = getEffectiveTime(s);
        if (eff < bestTime) bestTime = eff;
      }
      if (bestTime < Infinity) {
        for (const s of roundSolves) {
          if (getEffectiveTime(s) === bestTime) {
            wins.set(s.playerId, (wins.get(s.playerId) ?? 0) + 1);
          }
        }
      }
    }
    return wins;
  }, [roomStore.solves, roomStore.currentRound]);

  // Self first, then everyone else.
  const sortedPlayers = useMemo(() => {
    const me = roomStore.players.find(p => p.id === roomStore.playerId);
    const others = roomStore.players.filter(p => p.id !== roomStore.playerId);
    return me ? [me, ...others] : others;
  }, [roomStore.players, roomStore.playerId]);

  return (
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
            ...vhSafe(85),
            display: 'flex',
            flexDirection: 'column',
            pb: 'calc(env(safe-area-inset-bottom, 0px))',
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

      {/* Header: room code + share + close. The user's identity is shown
          in their own player card below, so we don't repeat it here. */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography
            sx={{
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              fontSize: '0.65rem',
              fontWeight: 700,
              color: 'text.secondary',
            }}>
            {t('room.roomLabel')}
          </Typography>
          <Typography
            sx={{
              color: 'primary.main',
              fontWeight: 800,
              fontSize: '1rem',
              letterSpacing: '0.05em',
            }}>
            {roomStore.roomCode}
          </Typography>
          <IconButton
            size="small"
            onClick={onShareInvite}
            aria-label={t('room.shareTitle')}
            sx={{ p: 0.5, color: 'text.secondary' }}>
            <ShareIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
        <IconButton
          size="medium"
          onClick={onClose}
          aria-label={t('common.cancel')}
          sx={{ color: 'text.secondary', p: 0.875 }}>
          <CloseIcon sx={{ fontSize: 22 }} />
        </IconButton>
      </Box>

      {/* Competitors list */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          px: 1.5,
          py: 1.5,
        }}>
        <Typography
          sx={{
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontSize: '0.65rem',
            fontWeight: 700,
            color: 'text.secondary',
            px: 0.5,
            mb: 1,
          }}>
          {t('room.competitors')} ({roomStore.players.length})
        </Typography>
        <Stack spacing={1.25}>
          {sortedPlayers.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              isMe={player.id === roomStore.playerId}
              winCount={winsByPlayer.get(player.id) ?? 0}
              precision={precision}
            />
          ))}
        </Stack>
      </Box>

      {/* Host controls + Leave — bottom action bar */}
      <Box
        sx={{
          flexShrink: 0,
          borderTop: '1px solid',
          borderColor: 'divider',
          p: 2,
        }}>
        <HostControls onAfterReset={onClose} />
        <Button
          variant="outlined"
          color="error"
          fullWidth
          size="large"
          onClick={onLeave}
          sx={{
            mt: roomStore.isHost ? 1.5 : 0,
            textTransform: 'none',
            fontWeight: 700,
            py: 1.25,
          }}>
          {t('room.leave')}
        </Button>
      </Box>
    </Drawer>
  );
});

interface PlayerCardProps {
  player: Player;
  isMe: boolean;
  winCount: number;
  precision: 1 | 2;
}

const PlayerCard = observer(function PlayerCard({
  player,
  isMe,
  winCount,
  precision,
}: PlayerCardProps) {
  const { roomStore } = useStore();
  const { t } = useTranslation();
  const prevRound = roomStore.currentRound - 1;

  const currentSolve = roomStore.solves.find(
    s => s.playerId === player.id && s.round === roomStore.currentRound,
  );
  const lastSolve = roomStore.solves.find(
    s => s.playerId === player.id && s.round === prevRound,
  );
  const playerSolves = roomStore.solves
    .filter(s => s.playerId === player.id)
    .sort((a, b) => b.round - a.round);
  const ao5 = calculateAverage(playerSolves, 5, 2);
  const ao12 = calculateAverage(playerSolves, 12, 3);
  const bestTime = roomStore.getBestTime(player.id);
  const globalAvg = roomStore.getGlobalAverage(player.id);

  const hasFinished = !!currentSolve;
  const isDisconnected = !!player.disconnected;
  const isSolving =
    !hasFinished && !isDisconnected && roomStore.solvingPlayerIds.has(player.id);

  const dotColor = isDisconnected
    ? '#f44336'
    : hasFinished
      ? 'primary.main'
      : isSolving
        ? '#ffb300'
        : undefined;
  const dotOpacity = isDisconnected || hasFinished || isSolving ? 1 : 0.3;
  const dotTooltip = isDisconnected
    ? t('room.disconnected')
    : hasFinished
      ? t('room.finished')
      : isSolving
        ? t('room.solving')
        : t('room.idle');

  return (
    <Box
      sx={{
        px: 1.5,
        py: 1.25,
        borderRadius: 2,
        border: '1px solid',
        borderColor: isMe
          ? 'rgba(255, 105, 180, 0.35)'
          : 'rgba(255, 105, 180, 0.08)',
        bgcolor: isMe
          ? 'rgba(255, 105, 180, 0.06)'
          : 'rgba(255, 255, 255, 0.04)',
      }}>
      {/* Row 1: identity + status dot */}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: '1rem',
            color: isMe ? 'primary.main' : 'text.primary',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minWidth: 0,
          }}>
          {isMe ? t('room.you') : player.name}
        </Typography>
        {player.isHost && (
          <Typography
            sx={{
              fontSize: '0.6rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'primary.main',
              opacity: 0.8,
              flexShrink: 0,
            }}>
            {t('room.host')}
          </Typography>
        )}
        <Stack
          direction="row"
          spacing={0.25}
          alignItems="center"
          sx={{
            flexShrink: 0,
            color: winCount > 0 ? 'primary.main' : 'text.secondary',
            opacity: winCount > 0 ? 1 : 0.5,
          }}>
          <EmojiEventsIcon sx={{ fontSize: 16 }} />
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 800 }}>
            {winCount}
          </Typography>
        </Stack>
        <Box sx={{ flex: 1 }} />
        <Tooltip title={dotTooltip} arrow placement="top">
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              flexShrink: 0,
              bgcolor: dotColor ?? 'text.secondary',
              opacity: dotOpacity,
              boxShadow: isDisconnected
                ? '0 0 8px rgba(244, 67, 54, 0.6)'
                : hasFinished
                  ? '0 0 8px rgba(255, 105, 180, 0.6)'
                  : isSolving
                    ? '0 0 8px rgba(255, 179, 0, 0.6)'
                    : 'none',
              transition: 'all 0.2s',
            }}
          />
        </Tooltip>
        {roomStore.isHost && !isMe && (
          <IconButton
            size="small"
            onClick={() => roomStore.kickPlayer(player.id)}
            aria-label={t('room.kick')}
            sx={{ p: 0.5, color: 'text.secondary', flexShrink: 0 }}>
            <LogoutIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Stack>

      {/* Row 2: Current / Last / Best */}
      <Stack direction="row" spacing={2.5} sx={{ mt: 1 }}>
        <StatColumn
          label={t('room.current')}
          solve={currentSolve}
          precision={precision}
          highlight={hasFinished}
        />
        <StatColumn
          label={t('room.last')}
          solve={lastSolve}
          precision={precision}
        />
        <StatColumn
          label={t('room.best')}
          value={bestTime !== null ? formatTime(bestTime, precision) : null}
        />
      </Stack>

      {/* Row 3: averages — only for opponents (less interesting for self in
          a sheet that's primarily about checking on others). */}
      {!isMe && (ao5 !== null || ao12 !== null || globalAvg !== null) && (
        <Stack direction="row" spacing={1.75} sx={{ mt: 0.75 }}>
          <Typography
            sx={{
              fontSize: '0.7rem',
              color: 'text.secondary',
              fontFamily: 'monospace',
            }}>
            ao5 {formatAverage(ao5, precision)}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.7rem',
              color: 'text.secondary',
              fontFamily: 'monospace',
            }}>
            ao12 {formatAverage(ao12, precision)}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.7rem',
              color: 'text.secondary',
              fontFamily: 'monospace',
            }}>
            avg {globalAvg !== null ? formatTime(globalAvg, precision) : '—'}
          </Typography>
        </Stack>
      )}
    </Box>
  );
});

interface StatColumnProps {
  label: string;
  solve?: RoomSolve;
  value?: string | null;
  precision?: 1 | 2;
  highlight?: boolean;
}

function StatColumn({
  label,
  solve,
  value,
  precision = 2,
  highlight = false,
}: StatColumnProps) {
  const display =
    value !== undefined
      ? (value ?? '—')
      : solve
        ? getDisplayTime(solve, precision)
        : '—';
  return (
    <Box>
      <Typography
        sx={{
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontSize: '0.6rem',
          fontWeight: 700,
          color: 'text.secondary',
          mb: 0.25,
        }}>
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: 'monospace',
          fontVariantNumeric: 'tabular-nums',
          fontSize: '1rem',
          fontWeight: 700,
          color: highlight ? 'primary.main' : 'text.primary',
        }}>
        {display}
      </Typography>
    </Box>
  );
}

export default RoomSidebarSheet;
