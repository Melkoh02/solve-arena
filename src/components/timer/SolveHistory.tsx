import { observer } from 'mobx-react-lite';
import {
  Box,
  Button,
  ButtonGroup,
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

const SolveHistory = observer(function SolveHistory() {
  const { timerStore } = useStore();
  const { t } = useTranslation();
  const solves = timerStore.currentEventSolves;

  if (solves.length === 0) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography color="text.secondary" textAlign="center">
          {t('timer.noSolves')}
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t('timer.columnIndex')}</TableCell>
            <TableCell>{t('timer.columnTime')}</TableCell>
            <TableCell>{t('timer.columnScramble')}</TableCell>
            <TableCell align="right">{t('timer.columnActions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {solves.map((solve, index) => (
            <TableRow key={solve.id}>
              <TableCell>{solves.length - index}</TableCell>
              <TableCell
                sx={{ fontFamily: 'monospace', fontWeight: 600 }}
              >
                {getDisplayTime(solve)}
              </TableCell>
              <TableCell
                sx={{
                  maxWidth: 300,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                }}
              >
                {solve.scramble}
              </TableCell>
              <TableCell align="right">
                <ButtonGroup size="small" sx={{ mr: 1 }}>
                  <Button
                    variant={
                      solve.penalty === '+2' ? 'contained' : 'outlined'
                    }
                    onClick={() => timerStore.setPenalty(solve.id, '+2')}
                  >
                    +2
                  </Button>
                  <Button
                    variant={
                      solve.penalty === 'DNF' ? 'contained' : 'outlined'
                    }
                    onClick={() => timerStore.setPenalty(solve.id, 'DNF')}
                  >
                    DNF
                  </Button>
                </ButtonGroup>
                <IconButton
                  size="small"
                  onClick={() => timerStore.deleteSolve(solve.id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

export default SolveHistory;
