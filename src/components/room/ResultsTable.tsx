import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Button,
  ButtonGroup,
  Paper,
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
import type { Player, RoomSolve } from '../../lib/types/room';
import type { Penalty } from '../../lib/types/timer';

const ResultsTable = observer(function ResultsTable() {
  const { roomStore } = useStore();
  const { t } = useTranslation();

  const completedRounds = useMemo(() => {
    const rounds = new Set(roomStore.solves.map(s => s.round));
    return Array.from(rounds)
      .filter(r => r < roomStore.currentRound)
      .sort((a, b) => b - a);
  }, [roomStore.solves, roomStore.currentRound]);

  if (completedRounds.length === 0) return null;

  const getSolve = (
    round: number,
    playerId: string,
  ): RoomSolve | undefined =>
    roomStore.solves.find(
      s => s.round === round && s.playerId === playerId,
    );

  return (
    <>
      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
        {t('room.history')}
      </Typography>
      <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('room.round')}</TableCell>
              {roomStore.players.map((player: Player) => (
                <TableCell key={player.id} sx={{ fontWeight: 600 }}>
                  {player.name}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {completedRounds.map(round => (
              <TableRow key={round}>
                <TableCell>{round}</TableCell>
                {roomStore.players.map((player: Player) => {
                  const solve = getSolve(round, player.id);
                  const isMe = player.id === roomStore.playerId;

                  return (
                    <TableCell key={player.id}>
                      {solve ? (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}>
                          <Typography
                            variant="body2"
                            component="span"
                            sx={{ fontFamily: 'monospace' }}>
                            {getDisplayTime(solve)}
                          </Typography>
                          {isMe && (
                            <ButtonGroup size="small">
                              <Button
                                size="small"
                                variant={
                                  solve.penalty === '+2'
                                    ? 'contained'
                                    : 'outlined'
                                }
                                sx={{
                                  minWidth: 28,
                                  px: 0.5,
                                  fontSize: '0.65rem',
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
                                  minWidth: 28,
                                  px: 0.5,
                                  fontSize: '0.65rem',
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
                          )}
                        </Box>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
});

export default ResultsTable;
