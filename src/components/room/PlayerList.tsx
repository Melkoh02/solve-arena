import { observer } from 'mobx-react-lite';
import {
  Button,
  ButtonGroup,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../lib/hooks/useStore';
import { getDisplayTime } from '../../lib/utils/formatTime';
import type { Penalty } from '../../lib/types/timer';

const PlayerList = observer(function PlayerList() {
  const { roomStore } = useStore();
  const { t } = useTranslation();
  const roundSolves = roomStore.currentRoundSolves;

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t('room.player')}</TableCell>
            <TableCell>{t('timer.columnTime')}</TableCell>
            <TableCell align="right">{t('timer.columnActions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {roomStore.players.map(player => {
            const solve = roundSolves.find(s => s.playerId === player.id);
            const isMe = player.id === roomStore.playerId;

            return (
              <TableRow key={player.id}>
                <TableCell>
                  {player.name}
                  {player.isHost && (
                    <Chip
                      label={t('room.host')}
                      size="small"
                      color="primary"
                      sx={{ ml: 1 }}
                    />
                  )}
                  {isMe && (
                    <Chip
                      label={t('room.you')}
                      size="small"
                      variant="outlined"
                      sx={{ ml: 0.5 }}
                    />
                  )}
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  {solve ? (
                    getDisplayTime(solve)
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      component="span">
                      {t('room.solving')}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  {solve && isMe && (
                    <ButtonGroup size="small" sx={{ mr: 1 }}>
                      <Button
                        variant={
                          solve.penalty === '+2' ? 'contained' : 'outlined'
                        }
                        onClick={() =>
                          roomStore.updatePenalty(solve.id, '+2' as Penalty)
                        }>
                        +2
                      </Button>
                      <Button
                        variant={
                          solve.penalty === 'DNF' ? 'contained' : 'outlined'
                        }
                        onClick={() =>
                          roomStore.updatePenalty(solve.id, 'DNF' as Penalty)
                        }>
                        DNF
                      </Button>
                    </ButtonGroup>
                  )}
                  {roomStore.isHost && !isMe && (
                    <IconButton
                      size="small"
                      onClick={() => roomStore.kickPlayer(player.id)}
                      title={t('room.kick')}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

export default PlayerList;
