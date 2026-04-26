import { observer } from 'mobx-react-lite';
import {
  Box,
  Button,
  ButtonGroup,
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
import GroupsIcon from '@mui/icons-material/Groups';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../lib/hooks/useStore';
import { useIsMobile } from '../../lib/hooks/useIsMobile';
import {
  getDisplayTime,
  getDisplayTimeForExport,
} from '../../lib/utils/formatTime';
import CrossColorPicker from '../room/CrossColorPicker';
import type { SoloSolve } from '../../lib/stores/soloStore';
import { CROSS_COLOR_LABEL } from '../../lib/constants/crossColors';
import type { Penalty } from '../../lib/types/timer';

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

const LABEL_SX = {
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  fontSize: '0.6rem',
  fontWeight: 700,
  color: 'text.secondary',
  mb: 0.5,
} as const;

interface Props {
  solve: SoloSolve | null;
  onClose: () => void;
}

const SoloSolveDetailModal = observer(function SoloSolveDetailModal({
  solve,
  onClose,
}: Props) {
  const { soloStore, settingsStore } = useStore();
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const precision = settingsStore.timerPrecision;

  if (!solve) return null;

  // Keep in sync with store (penalty updates)
  const liveSolve = soloStore.solves.find(s => s.id === solve.id) ?? solve;

  return (
    <Dialog
      open={!!solve}
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
            // On mobile we keep tighter side margins so the content has room
            mx: isMobile ? 1.5 : undefined,
            // Avoid the dialog hugging the edges of the safe area on iOS
            my: isMobile
              ? 'calc(env(safe-area-inset-top, 0px) + 16px)'
              : undefined,
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
          {t('room.solveDetails')}
        </Typography>
        <IconButton size={isMobile ? 'medium' : 'small'} onClick={onClose}>
          <CloseIcon
            sx={{ fontSize: isMobile ? 24 : 18, color: 'text.secondary' }}
          />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {/* Time */}
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
              fontSize: isMobile
                ? 'clamp(3rem, 14vw, 4.5rem)'
                : 'clamp(2.2rem, 10vw, 3.2rem)',
              fontWeight: 900,
              fontVariantNumeric: 'tabular-nums',
              color: 'primary.main',
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}>
            {getDisplayTime(liveSolve, precision)}
          </Typography>
        </Box>

        {/* Penalty + cross color */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: isMobile ? 2 : 1.5,
            mb: 2.5,
          }}>
          <ButtonGroup size={isMobile ? 'medium' : 'small'}>
            <Button
              variant={liveSolve.penalty === '+2' ? 'contained' : 'outlined'}
              onClick={() =>
                soloStore.updatePenalty(liveSolve.id, '+2' as Penalty)
              }
              sx={{ minWidth: isMobile ? 64 : 48 }}>
              +2
            </Button>
            <Button
              variant={liveSolve.penalty === 'DNF' ? 'contained' : 'outlined'}
              onClick={() =>
                soloStore.updatePenalty(liveSolve.id, 'DNF' as Penalty)
              }
              sx={{ minWidth: isMobile ? 64 : 48 }}>
              DNF
            </Button>
          </ButtonGroup>
          <CrossColorPicker
            value={liveSolve.crossColor}
            onChange={color => soloStore.updateCrossColor(liveSolve.id, color)}
            size={isMobile ? 32 : 24}
          />
        </Box>

        {/* Details */}
        <Stack spacing={1.25}>
          <Box
            sx={{
              p: 1.25,
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.default',
            }}>
            <Typography sx={LABEL_SX}>{t('room.dateTime')}</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
              {new Date(liveSolve.date).toLocaleString(i18n.language)}
            </Typography>
          </Box>

          {liveSolve.online && (
            <Box
              sx={{
                p: 1.25,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.default',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}>
              <GroupsIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                {t('solo.onlineRoom')}
              </Typography>
            </Box>
          )}

          <Box>
            <Typography sx={LABEL_SX}>{t('room.scrambleLabel')}</Typography>
            <Box
              sx={{
                p: 1.25,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.default',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                color: 'text.secondary',
                lineHeight: 1.6,
                wordBreak: 'break-word',
              }}>
              {liveSolve.scramble}
            </Box>
          </Box>
        </Stack>

        {/* Copy & Export buttons */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 1,
            justifyContent: 'center',
            mt: 2,
          }}>
          <Button
            size={isMobile ? 'medium' : 'small'}
            variant="outlined"
            fullWidth={isMobile}
            startIcon={<ContentCopyIcon sx={{ fontSize: 16 }} />}
            onClick={() => {
              const exportFmt = settingsStore.timeFormat;
              const text = [
                `Time: ${getDisplayTimeForExport(liveSolve, precision, exportFmt)}`,
                `Scramble: ${liveSolve.scramble}`,
                `Cross: ${CROSS_COLOR_LABEL[liveSolve.crossColor] ?? liveSolve.crossColor}`,
                `Date: ${formatDateFull(liveSolve.date)}`,
                '',
                'Powered by Solve Arena',
              ].join('\n');
              navigator.clipboard.writeText(text);
            }}
            sx={{
              textTransform: 'none',
              fontSize: isMobile ? '0.85rem' : '0.75rem',
            }}>
            Copy
          </Button>
          <Button
            size={isMobile ? 'medium' : 'small'}
            variant="outlined"
            fullWidth={isMobile}
            startIcon={<FileDownloadIcon sx={{ fontSize: 16 }} />}
            onClick={() => {
              const exportFmt2 = settingsStore.timeFormat;
              const header = 'Time,Penalty,Scramble,CrossColor,Date';
              const time = getDisplayTimeForExport(
                liveSolve,
                precision,
                exportFmt2,
              );
              const penalty =
                liveSolve.penalty === 'none' ? '' : liveSolve.penalty;
              const scramble = `"${liveSolve.scramble.replace(/"/g, '""')}"`;
              const cross =
                CROSS_COLOR_LABEL[liveSolve.crossColor] ?? liveSolve.crossColor;
              const date = formatDateFull(liveSolve.date);
              const csv = `${header}\n${time},${penalty},${scramble},${cross},${date}`;
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `solve_${Date.now()}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            sx={{
              textTransform: 'none',
              fontSize: isMobile ? '0.85rem' : '0.75rem',
            }}>
            Export CSV
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
});

export default SoloSolveDetailModal;
