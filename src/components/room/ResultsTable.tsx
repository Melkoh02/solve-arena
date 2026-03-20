import { useMemo } from 'react';
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

  const getSolve = (round: number, playerId: string): RoomSolve | undefined =>
    roomStore.solves.find(s => s.round === round && s.playerId === playerId);

  return (
    <>
      <Typography
        sx={{
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          fontSize: '0.6rem',
          fontWeight: 700,
          color: 'text.secondary',
          mb: 1,
        }}>
        {t('room.history')}
      </Typography>
      <TableContainer
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          maxHeight: 180,
        }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ bgcolor: 'background.paper' }}>
                {t('room.round')}
              </TableCell>
              {roomStore.players.map((player: Player) => (
                <TableCell key={player.id} sx={{ bgcolor: 'background.paper' }}>
                  {player.id === roomStore.playerId
                    ? t('room.you')
                    : player.name}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {completedRounds.map(round => (
              <TableRow key={round}>
                <TableCell
                  sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                  {round}
                </TableCell>
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
                            gap: 3,
                          }}>
                          <Typography
                            variant="body2"
                            component="span"
                            sx={{
                              fontFamily: 'monospace',
                              fontVariantNumeric: 'tabular-nums',
                              fontWeight: isMe ? 600 : 400,
                              color: isMe ? 'primary.main' : 'text.primary',
                              fontSize: '0.8rem',
                              minWidth: '4.5em',
                              display: 'inline-block',
                              textAlign: 'right',
                            }}>
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
                          )}
                        </Box>
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                          -
                        </Typography>
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
