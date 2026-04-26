import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Button,
  ButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import GroupsIcon from '@mui/icons-material/Groups';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../lib/hooks/useStore';
import { getDisplayTime } from '../../lib/utils/formatTime';
import { formatAverage } from '../../lib/utils/averages';
import CrossColorPicker from '../room/CrossColorPicker';
import type { SoloSolve } from '../../lib/stores/soloStore';
import type { Penalty } from '../../lib/types/timer';

const PAGE_SIZE = 50;

type SortKey = 'index' | 'time' | 'ao5' | 'ao12' | 'date';
type SortDir = 'asc' | 'desc';

interface HistoryRow {
  solve: SoloSolve;
  index: number;
  ao5: number | null;
  ao12: number | null;
}

export interface SoloHistoryProps {
  onSelectSolve: (solve: SoloSolve) => void;
  onSelectAo: (solves: SoloSolve[], size: number) => void;
}

const HEADER_SX = {
  bgcolor: 'background.paper',
  fontWeight: 700,
  fontSize: '0.7rem',
  cursor: 'pointer',
  userSelect: 'none',
  whiteSpace: 'nowrap',
} as const;

function getSortValue(row: HistoryRow, key: SortKey): number {
  switch (key) {
    case 'index':
      return row.index;
    case 'time':
      return row.solve.penalty === 'DNF' ? Infinity : row.solve.time;
    case 'ao5':
      return row.ao5 ?? -1;
    case 'ao12':
      return row.ao12 ?? -1;
    case 'date':
      return row.solve.date;
  }
}

function formatShortDate(ts: number): string {
  const d = new Date(ts);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${mins}`;
}

const SoloHistory = observer(function SoloHistory({
  onSelectSolve,
  onSelectAo,
}: SoloHistoryProps) {
  const { soloStore, settingsStore } = useStore();
  const { t } = useTranslation();
  const precision = settingsStore.timerPrecision;

  const [sortKey, setSortKey] = useState<SortKey>('index');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [deleteTarget, setDeleteTarget] = useState<SoloSolve | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const rows = soloStore.historyRows;

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const va = getSortValue(a, sortKey);
      const vb = getSortValue(b, sortKey);
      if (va === vb) return 0;
      return sortDir === 'asc' ? (va < vb ? -1 : 1) : va > vb ? -1 : 1;
    });
  }, [rows, sortKey, sortDir]);

  const visibleRows = useMemo(
    () => sortedRows.slice(0, visibleCount),
    [sortedRows, visibleCount],
  );

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const io = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount(prev => {
            if (prev >= sortedRows.length) return prev;
            return prev + PAGE_SIZE;
          });
        }
      },
      { threshold: 0.1 },
    );

    io.observe(sentinel);
    return () => io.disconnect();
  }, [sortedRows.length]);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (key === sortKey) {
        setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('desc');
      }
    },
    [sortKey],
  );

  const getAoSolves = useCallback(
    (row: HistoryRow, size: number): SoloSolve[] => {
      const es = soloStore.eventSolves;
      // row.index is 1-based, the window ends at row.index (inclusive)
      const endIdx = row.index; // exclusive in slice = row.index
      const startIdx = endIdx - size;
      if (startIdx < 0) return [];
      return es.slice(startIdx, endIdx);
    },
    [soloStore],
  );

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    const Icon = sortDir === 'asc' ? ArrowUpwardIcon : ArrowDownwardIcon;
    return <Icon sx={{ fontSize: 14, ml: 0.25, verticalAlign: 'middle' }} />;
  };

  if (rows.length === 0) return null;

  return (
    <TableContainer
      sx={{
        pb: 2,
        overflow: 'visible',
      }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell
              sx={{ ...HEADER_SX, width: 40 }}
              onClick={() => handleSort('index')}>
              #{renderSortIcon('index')}
            </TableCell>
            <TableCell
              sx={{ ...HEADER_SX, pl: 'calc(16px + 14px + 8px)' }}
              onClick={() => handleSort('time')}>
              {t('timer.columnTime')}
              {renderSortIcon('time')}
            </TableCell>
            <TableCell sx={HEADER_SX} onClick={() => handleSort('ao5')}>
              ao5{renderSortIcon('ao5')}
            </TableCell>
            <TableCell sx={HEADER_SX} onClick={() => handleSort('ao12')}>
              ao12{renderSortIcon('ao12')}
            </TableCell>
            <TableCell sx={HEADER_SX} onClick={() => handleSort('date')}>
              {t('room.dateTime').replace('& ', '')}
              {renderSortIcon('date')}
            </TableCell>
            <TableCell sx={{ ...HEADER_SX, width: 32, pr: { xs: 1.5, sm: 2, md: 3 } }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleRows.map(row => (
            <TableRow key={row.solve.id} hover>
              <TableCell
                sx={{
                  color: 'text.secondary',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                }}>
                {row.index}
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 14,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    {row.solve.online && (
                      <GroupsIcon
                        titleAccess={t('solo.onlineTooltip')}
                        sx={{
                          fontSize: 14,
                          color: 'text.secondary',
                          opacity: 0.5,
                        }}
                      />
                    )}
                  </Box>
                  <Typography
                    component="span"
                    onClick={() => onSelectSolve(row.solve)}
                    sx={{
                      fontFamily: 'monospace',
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      width: '9ch',
                      flexShrink: 0,
                      display: 'inline-block',
                      textAlign: 'left',
                      '&:hover': { color: 'primary.main' },
                    }}>
                    {getDisplayTime(row.solve, precision)}
                  </Typography>
                  <ButtonGroup size="small">
                    <Button
                      size="small"
                      variant={
                        row.solve.penalty === '+2' ? 'contained' : 'outlined'
                      }
                      sx={{ minWidth: 24, px: 0.3, py: 0, fontSize: '0.6rem' }}
                      onClick={() =>
                        soloStore.updatePenalty(row.solve.id, '+2' as Penalty)
                      }>
                      +2
                    </Button>
                    <Button
                      size="small"
                      variant={
                        row.solve.penalty === 'DNF' ? 'contained' : 'outlined'
                      }
                      sx={{ minWidth: 24, px: 0.3, py: 0, fontSize: '0.6rem' }}
                      onClick={() =>
                        soloStore.updatePenalty(row.solve.id, 'DNF' as Penalty)
                      }>
                      DNF
                    </Button>
                  </ButtonGroup>
                  <CrossColorPicker
                    value={row.solve.crossColor}
                    onChange={color =>
                      soloStore.updateCrossColor(row.solve.id, color)
                    }
                    size={18}
                  />
                </Box>
              </TableCell>
              <TableCell
                onClick={
                  row.ao5 !== null
                    ? () => onSelectAo(getAoSolves(row, 5), 5)
                    : undefined
                }
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                  cursor: row.ao5 !== null ? 'pointer' : 'default',
                  '&:hover': row.ao5 !== null ? { color: 'primary.main' } : {},
                }}>
                {formatAverage(row.ao5, precision)}
              </TableCell>
              <TableCell
                onClick={
                  row.ao12 !== null
                    ? () => onSelectAo(getAoSolves(row, 12), 12)
                    : undefined
                }
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                  cursor: row.ao12 !== null ? 'pointer' : 'default',
                  '&:hover': row.ao12 !== null ? { color: 'primary.main' } : {},
                }}>
                {formatAverage(row.ao12, precision)}
              </TableCell>
              <TableCell
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.7rem',
                  color: 'text.secondary',
                }}>
                {formatShortDate(row.solve.date)}
              </TableCell>
              <TableCell sx={{ p: 0, textAlign: 'center', pr: { xs: 1.5, sm: 2, md: 3 } }}>
                <IconButton
                  size="small"
                  onClick={() => setDeleteTarget(row.solve)}
                  sx={{
                    p: 0.25,
                    color: 'text.secondary',
                    opacity: 0.4,
                    '&:hover': { opacity: 1, color: 'error.main' },
                  }}>
                  <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Box ref={sentinelRef} sx={{ height: 1 }} />

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (deleteTarget) soloStore.deleteSolve(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
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
    </TableContainer>
  );
});

export default SoloHistory;
