import { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Box, Stack, ToggleButton, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../../lib/hooks/useStore';
import { getDisplayTime } from '../../../lib/utils/formatTime';
import { getEffectiveTime } from '../../../lib/utils/averages';
import { CROSS_COLORS } from '../../../lib/constants/crossColors';
import CrossColorPicker from '../CrossColorPicker';
import SolveDetailModal from '../SolveDetailModal';
import type { Penalty } from '../../../lib/types/timer';
import type { Player, RoomSolve } from '../../../lib/types/room';

const PAGE_SIZE = 50;
const ROUND_BADGE_WIDTH = 44;
const PLAYER_CELL_MIN_WIDTH_ME = 180;
const PLAYER_CELL_MIN_WIDTH_OTHER = 110;

const PENALTY_TOGGLE_SX = {
  minWidth: 36,
  px: 0.75,
  py: 0.5,
  fontSize: '0.7rem',
  fontWeight: 700,
  border: '1px solid',
  borderColor: 'divider',
  color: 'text.secondary',
  '&.Mui-selected': {
    bgcolor: 'rgba(255, 105, 180, 0.16)',
    color: 'primary.main',
    borderColor: 'primary.main',
  },
} as const;

interface MobileResultsListProps {
  /** Scroll container element used as the IntersectionObserver root so
   * infinite scroll fires correctly inside a nested scrollable drawer.
   * Passed as an element (not a ref) so the IO effect can react to it
   * mounting — refs aren't reactive. */
  scrollEl?: HTMLDivElement | null;
}

const MobileResultsList = observer(function MobileResultsList({
  scrollEl,
}: MobileResultsListProps) {
  const { roomStore, settingsStore } = useStore();
  const precision = settingsStore.timerPrecision;

  const [selectedSolve, setSelectedSolve] = useState<RoomSolve | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // Callback ref so the IO effect re-runs when React attaches the sentinel.
  const [sentinelEl, setSentinelEl] = useState<HTMLDivElement | null>(null);

  // Most-recent first, only completed rounds
  const completedRounds = useMemo(() => {
    const rounds = new Set(roomStore.solves.map(s => s.round));
    return Array.from(rounds)
      .filter(r => r < roomStore.currentRound)
      .sort((a, b) => b - a);
  }, [roomStore.solves, roomStore.currentRound]);

  const visibleRounds = useMemo(
    () => completedRounds.slice(0, visibleCount),
    [completedRounds, visibleCount],
  );

  // "You" first, then everyone else in their existing order
  const sortedPlayers = useMemo(() => {
    const me = roomStore.players.find(p => p.id === roomStore.playerId);
    const others = roomStore.players.filter(p => p.id !== roomStore.playerId);
    return me ? [me, ...others] : others;
  }, [roomStore.players, roomStore.playerId]);

  // Reset paging when the underlying list changes drastically
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [completedRounds.length]);

  useEffect(() => {
    if (!sentinelEl || !scrollEl) return;
    const io = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount(prev =>
            prev >= completedRounds.length ? prev : prev + PAGE_SIZE,
          );
        }
      },
      { root: scrollEl, rootMargin: '300px', threshold: 0 },
    );
    io.observe(sentinelEl);
    return () => io.disconnect();
  }, [completedRounds.length, sentinelEl, scrollEl]);

  // Live solve for the open detail modal (penalty/cross changes update immediately)
  const liveSolve = selectedSolve
    ? roomStore.solves.find(s => s.id === selectedSolve.id) ?? null
    : null;

  if (completedRounds.length === 0) return null;

  return (
    <>
      <Stack spacing={1} sx={{ p: 1.5 }}>
        {visibleRounds.map(round => (
          <RoundCard
            key={round}
            round={round}
            sortedPlayers={sortedPlayers}
            precision={precision}
            onSelect={setSelectedSolve}
          />
        ))}
        <Box ref={setSentinelEl} sx={{ height: 1 }} />
      </Stack>

      <SolveDetailModal solve={liveSolve} onClose={() => setSelectedSolve(null)} />
    </>
  );
});

interface RoundCardProps {
  round: number;
  sortedPlayers: Player[];
  precision: 1 | 2;
  onSelect: (solve: RoomSolve) => void;
}

const RoundCard = observer(function RoundCard({
  round,
  sortedPlayers,
  precision,
  onSelect,
}: RoundCardProps) {
  const { roomStore } = useStore();
  const { t } = useTranslation();

  // Fastest solve(s) for this round, computed locally so the card
  // re-renders when penalties change.
  const roundSolves = roomStore.solves.filter(s => s.round === round);
  let bestTime = Infinity;
  for (const s of roundSolves) {
    const eff = getEffectiveTime(s);
    if (eff < bestTime) bestTime = eff;
  }
  const fastestIds = new Set(
    roundSolves.filter(s => getEffectiveTime(s) === bestTime).map(s => s.id),
  );

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.25,
        px: 1.5,
        py: 1.25,
        borderRadius: 2,
        bgcolor: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid',
        borderColor: 'divider',
      }}>
      <Typography
        sx={{
          fontFamily: 'monospace',
          fontSize: '0.7rem',
          color: 'text.secondary',
          minWidth: ROUND_BADGE_WIDTH,
          flexShrink: 0,
          mt: 1.75, // align with the time, not the player label
        }}>
        #{round}
      </Typography>
      <Stack direction="row" spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
        {sortedPlayers.map(player => {
          const solve = roundSolves.find(s => s.playerId === player.id);
          const isMe = player.id === roomStore.playerId;
          const isFastest = !!solve && fastestIds.has(solve.id);
          return (
            <PlayerCell
              key={player.id}
              player={player}
              solve={solve}
              isMe={isMe}
              isFastest={isFastest}
              precision={precision}
              labelMe={t('room.you')}
              onSelect={onSelect}
            />
          );
        })}
      </Stack>
    </Box>
  );
});

interface PlayerCellProps {
  player: Player;
  solve: RoomSolve | undefined;
  isMe: boolean;
  isFastest: boolean;
  precision: 1 | 2;
  labelMe: string;
  onSelect: (solve: RoomSolve) => void;
}

const PlayerCell = observer(function PlayerCell({
  player,
  solve,
  isMe,
  isFastest,
  precision,
  labelMe,
  onSelect,
}: PlayerCellProps) {
  const { roomStore } = useStore();

  const togglePenalty = (next: Penalty) => {
    if (!solve) return;
    roomStore.updatePenalty(solve.id, next);
  };

  return (
    <Stack
      sx={{
        minWidth: isMe ? PLAYER_CELL_MIN_WIDTH_ME : PLAYER_CELL_MIN_WIDTH_OTHER,
        flexShrink: 0,
      }}
      spacing={0.25}>
      <Typography
        sx={{
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontSize: '0.6rem',
          fontWeight: 700,
          color: 'text.secondary',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
        {isMe ? labelMe : player.name}
      </Typography>
      {solve ? (
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Typography
            onClick={() => onSelect(solve)}
            sx={{
              fontFamily: 'monospace',
              fontVariantNumeric: 'tabular-nums',
              fontSize: '1.25rem',
              fontWeight: 700,
              cursor: 'pointer',
              color: isFastest ? 'primary.main' : 'text.primary',
              lineHeight: 1.1,
            }}>
            {getDisplayTime(solve, precision)}
          </Typography>
          {isMe && (
            <>
              <ToggleButton
                value="+2"
                selected={solve.penalty === '+2'}
                onChange={() => togglePenalty('+2')}
                size="small"
                sx={PENALTY_TOGGLE_SX}>
                +2
              </ToggleButton>
              <ToggleButton
                value="DNF"
                selected={solve.penalty === 'DNF'}
                onChange={() => togglePenalty('DNF')}
                size="small"
                sx={PENALTY_TOGGLE_SX}>
                DNF
              </ToggleButton>
              <CrossColorPicker
                value={solve.crossColor}
                onChange={color => roomStore.updateCrossColor(solve.id, color)}
                size={22}
              />
            </>
          )}
          {!isMe && solve.crossColor && (
            <Box
              sx={{
                width: 18,
                height: 18,
                borderRadius: 0.75,
                bgcolor:
                  CROSS_COLORS.find(c => c.key === solve.crossColor)?.hex ??
                  '#FFFFFF',
                border: '2px solid',
                borderColor: 'divider',
                flexShrink: 0,
              }}
            />
          )}
        </Stack>
      ) : (
        <Typography sx={{ color: 'text.secondary', fontSize: '1rem' }}>
          —
        </Typography>
      )}
    </Stack>
  );
});

export default MobileResultsList;
