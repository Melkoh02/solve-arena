import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { observer } from 'mobx-react-lite';
import { getDisplayTime, getDisplayTimeForExport } from '../../lib/utils/formatTime';
import { calculateAverage, formatAverage, getEffectiveTime } from '../../lib/utils/averages';
import { useStore } from '../../lib/hooks/useStore';
import { CROSS_COLOR_HEX, CROSS_COLOR_LABEL } from '../../lib/constants/crossColors';
import type { SoloSolve } from '../../lib/stores/soloStore';

export interface AverageDetailModalProps {
  solves: SoloSolve[] | null;
  size: number;
  onClose: () => void;
}

function getTrimmedIndices(solves: SoloSolve[], size: number): { bestIdx: number; worstIdx: number } {
  if (solves.length < size) return { bestIdx: -1, worstIdx: -1 };
  const window = solves.slice(0, size);
  const times = window.map(getEffectiveTime);

  let bestIdx = 0;
  let worstIdx = 0;
  for (let i = 1; i < times.length; i++) {
    if (times[i] < times[bestIdx]) bestIdx = i;
    if (times[i] > times[worstIdx]) worstIdx = i;
  }
  return { bestIdx, worstIdx };
}

function formatDateFull(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const mo = (d.getMonth() + 1).toString().padStart(2, '0');
  const da = d.getDate().toString().padStart(2, '0');
  const h = d.getHours().toString().padStart(2, '0');
  const mi = d.getMinutes().toString().padStart(2, '0');
  const s = d.getSeconds().toString().padStart(2, '0');
  return `${y}-${mo}-${da} ${h}:${mi}:${s}`;
}

const AverageDetailModal = observer(function AverageDetailModal({ solves, size, onClose }: AverageDetailModalProps) {
  const { settingsStore } = useStore();
  const precision = settingsStore.timerPrecision;

  if (!solves || solves.length === 0) return null;

  // solves come oldest-first from eventSolves slice, reverse for newest-first for calculateAverage
  const newestFirst = [...solves].reverse();
  const maxDnf = size === 5 ? 2 : 3;
  const avg = calculateAverage(newestFirst, size, maxDnf);
  const { bestIdx, worstIdx } = getTrimmedIndices(solves, size);

  const handleCopy = () => {
    const exportFmt = settingsStore.timeFormat;
    const window = solves.slice(0, size);
    const timesLine = window
      .map((s, i) => {
        const display = getDisplayTimeForExport(s, precision, exportFmt);
        return i === bestIdx || i === worstIdx ? `(${display})` : display;
      })
      .join(' - ');

    const scrambleLines = window.map((s, i) => {
      const display = getDisplayTimeForExport(s, precision, exportFmt);
      const timeStr = i === bestIdx || i === worstIdx ? `(${display})` : display;
      return `${i + 1}. ${timeStr}   ${s.scramble}`;
    });

    const text = [
      `Ao${size}: ${formatAverage(avg, precision)}`,
      `Times: ${timesLine}`,
      '',
      'Scrambles:',
      '',
      ...scrambleLines,
      '',
      'Powered by Solve Arena',
    ].join('\n');
    navigator.clipboard.writeText(text);
  };

  const handleExportCsv = () => {
    const exportFmt = settingsStore.timeFormat;
    const header = '#,Time,Penalty,Scramble,CrossColor,Date';
    const csvRows = solves.slice(0, size).map((s, i) => {
      const time = getDisplayTimeForExport(s, precision, exportFmt);
      const penalty = s.penalty === 'none' ? '' : s.penalty;
      const scramble = `"${s.scramble.replace(/"/g, '""')}"`;
      const cross = CROSS_COLOR_LABEL[s.crossColor] ?? s.crossColor;
      const date = formatDateFull(s.date);
      return `${i + 1},${time},${penalty},${scramble},${cross},${date}`;
    });

    const csv = [header, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ao${size}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog
      open={!!solves}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
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
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Average of {size}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {/* Average display */}
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'rgba(255, 105, 180, 0.06)',
            p: 2,
            mb: 2,
            textAlign: 'center',
          }}>
          <Typography
            sx={{
              fontFamily: '"Inter", monospace',
              fontSize: 'clamp(2.2rem, 10vw, 3.2rem)',
              fontWeight: 900,
              fontVariantNumeric: 'tabular-nums',
              color: 'primary.main',
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}>
            {formatAverage(avg, precision)}
          </Typography>
        </Box>

        {/* Solve list */}
        <Stack spacing={0.5} sx={{ mb: 2 }}>
          {solves.slice(0, size).map((s, i) => {
            const display = getDisplayTime(s, precision);
            const isBest = i === bestIdx;
            const isWorst = i === worstIdx;
            const trimmed = isBest || isWorst;

            return (
              <Box
                key={s.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: trimmed ? 'rgba(255, 105, 180, 0.04)' : 'transparent',
                }}>
                <Typography
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                    minWidth: 20,
                  }}>
                  {i + 1}.
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                    minWidth: 70,
                  }}>
                  {trimmed ? `(${display})` : display}
                </Typography>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: CROSS_COLOR_HEX[s.crossColor] ?? '#FFFFFF',
                    flexShrink: 0,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                />
                <Typography
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.65rem',
                    color: 'text.secondary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}>
                  {s.scramble}
                </Typography>
              </Box>
            );
          })}
        </Stack>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ContentCopyIcon sx={{ fontSize: 16 }} />}
            onClick={handleCopy}
            sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
            Copy
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<FileDownloadIcon sx={{ fontSize: 16 }} />}
            onClick={handleExportCsv}
            sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
            Export CSV
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
});

export default AverageDetailModal;
