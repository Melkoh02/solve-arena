import { useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Button,
  ButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../lib/hooks/useStore';
import { getDisplayTime } from '../../lib/utils/formatTime';
import { getEffectiveTime } from '../../lib/utils/averages';
import SolveDetailModal from './SolveDetailModal';
import type { Player, RoomSolve } from '../../lib/types/room';
import type { Penalty } from '../../lib/types/timer';
import CrossColorPicker from './CrossColorPicker';
import { CROSS_COLORS } from '../../lib/constants/crossColors';

const HEADER_SX = {
  bgcolor: 'background.paper',
  fontWeight: 700,
  fontSize: '0.7rem',
  userSelect: 'none',
  whiteSpace: 'nowrap',
} as const;

const PAGE_SIZE = 50;

const ResultsTable = observer(function ResultsTable() {
  const { roomStore, settingsStore } = useStore();
  const { t } = useTranslation();
  const precision = settingsStore.timerPrecision;
  const [selectedSolve, setSelectedSolve] = useState<RoomSolve | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [completedRounds.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const io = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount(prev =>
            prev >= completedRounds.length ? prev : prev + PAGE_SIZE,
          );
        }
      },
      { threshold: 0.1 },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [completedRounds.length]);

  // Sort players so "You" is always first
  const sortedPlayers = useMemo(() => {
    const me = roomStore.players.find(p => p.id === roomStore.playerId);
    const others = roomStore.players.filter(p => p.id !== roomStore.playerId);
    return me ? [me, ...others] : others;
  }, [roomStore.players, roomStore.playerId]);

  if (completedRounds.length === 0) return null;

  const getSolve = (round: number, playerId: string): RoomSolve | undefined =>
    roomStore.solves.find(s => s.round === round && s.playerId === playerId);

  const getFastestIds = (round: number): Set<string> => {
    const roundSolves = roomStore.solves.filter(s => s.round === round);
    let bestTime = Infinity;
    for (const s of roundSolves) {
      const eff = getEffectiveTime(s);
      if (eff < bestTime) bestTime = eff;
    }
    return new Set(
      roundSolves.filter(s => getEffectiveTime(s) === bestTime).map(s => s.id),
    );
  };

  // Keep modal in sync with live data (penalty updates)
  const liveSolve = selectedSolve
    ? (roomStore.solves.find(s => s.id === selectedSolve.id) ?? null)
    : null;

  return (
    <>
      <TableContainer
        sx={{
          pb: 2,
          overflow: 'visible',
        }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...HEADER_SX, width: 40 }}>
                {t('room.round')}
              </TableCell>
              {sortedPlayers.map((player: Player) => (
                <TableCell key={player.id} sx={HEADER_SX}>
                  {player.id === roomStore.playerId
                    ? t('room.you')
                    : player.name}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRounds.map(round => (
              <TableRow key={round} hover>
                <TableCell
                  sx={{
                    color: 'text.secondary',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                  }}>
                  {round}
                </TableCell>
                {(() => {
                  const fastestIds = getFastestIds(round);
                  return sortedPlayers.map((player: Player) => {
                    const solve = getSolve(round, player.id);
                    const isMe = player.id === roomStore.playerId;
                    const isFastest = !!solve && fastestIds.has(solve.id);

                    return (
                      <TableCell key={player.id}>
                        {solve ? (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}>
                            <Typography
                              component="span"
                              onClick={() => setSelectedSolve(solve)}
                              sx={{
                                fontFamily: 'monospace',
                                fontVariantNumeric: 'tabular-nums',
                                fontWeight: 600,
                                color: isFastest
                                  ? 'primary.main'
                                  : 'text.primary',
                                fontSize: '0.8rem',
                                width: '9ch',
                                flexShrink: 0,
                                display: 'inline-block',
                                textAlign: 'left',
                                cursor: 'pointer',
                                '&:hover': { color: 'primary.main' },
                              }}>
                              {getDisplayTime(solve, precision)}
                            </Typography>
                            {isMe ? (
                              <>
                                <ButtonGroup size="small">
                                  <Button
                                    size="small"
                                    variant={
                                      solve.penalty === '+2'
                                        ? 'contained'
                                        : 'outlined'
                                    }
                                    sx={{
                                      minWidth: 24,
                                      px: 0.3,
                                      py: 0,
                                      fontSize: '0.6rem',
                                    }}
                                    onClick={() =>
                                      roomStore.updatePenalty(
                                        solve.id,
                                        '+2' as Penalty,
                                      )
                                    }>
                                    +2
                                  </Button>
                                  <Button
                                    size="small"
                                    variant={
                                      solve.penalty === 'DNF'
                                        ? 'contained'
                                        : 'outlined'
                                    }
                                    sx={{
                                      minWidth: 24,
                                      px: 0.3,
                                      py: 0,
                                      fontSize: '0.6rem',
                                    }}
                                    onClick={() =>
                                      roomStore.updatePenalty(
                                        solve.id,
                                        'DNF' as Penalty,
                                      )
                                    }>
                                    DNF
                                  </Button>
                                </ButtonGroup>
                                <CrossColorPicker
                                  value={solve.crossColor}
                                  onChange={color =>
                                    roomStore.updateCrossColor(solve.id, color)
                                  }
                                  size={18}
                                />
                              </>
                            ) : (
                              solve.crossColor && (
                                <Box
                                  sx={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: 0.75,
                                    bgcolor:
                                      CROSS_COLORS.find(
                                        c => c.key === solve.crossColor,
                                      )?.hex ?? '#FFFFFF',
                                    border: '2px solid',
                                    borderColor: 'divider',
                                    flexShrink: 0,
                                  }}
                                />
                              )
                            )}
                          </Box>
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'text.secondary',
                              fontSize: '0.8rem',
                            }}>
                            -
                          </Typography>
                        )}
                      </TableCell>
                    );
                  });
                })()}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box ref={sentinelRef} sx={{ height: 1 }} />

      <SolveDetailModal
        solve={liveSolve}
        onClose={() => setSelectedSolve(null)}
      />
    </>
  );
});

export default ResultsTable;
