import { useState } from 'react';
import {
  Box,
  Button,
  ButtonBase,
  Drawer,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import MoreTimeIcon from '@mui/icons-material/MoreTime';
import { useTranslation } from 'react-i18next';
import { formatTime } from '../../../lib/utils/formatTime';

const MAX_TIME_MS = 3_599_990;

function parseTimeInput(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  let ms: number;
  if (trimmed.includes('.')) {
    const secs = parseFloat(trimmed);
    if (isNaN(secs) || secs <= 0) return null;
    ms = Math.round(secs * 1000);
  } else if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    if (parts.length !== 2) return null;
    const mins = parseInt(parts[0], 10);
    const rest = parseFloat(parts[1]);
    if (isNaN(mins) || isNaN(rest)) return null;
    ms = Math.round((mins * 60 + rest) * 1000);
  } else {
    const digits = trimmed.replace(/\D/g, '');
    if (!digits || digits === '0') return null;
    const num = parseInt(digits, 10);
    const cs = num % 100;
    const secs = Math.floor(num / 100) % 100;
    const mins = Math.floor(num / 10000);
    ms = mins * 60000 + secs * 1000 + cs * 10;
  }
  if (ms <= 0 || ms > MAX_TIME_MS) return null;
  return ms;
}

export interface ScrambleActionSheetProps {
  open: boolean;
  onClose: () => void;
  showPreview: boolean;
  onTogglePreview: () => void;
  /** Optional — multiplayer scrambles are server-controlled, so this row is hidden when unset. */
  onSetCustomScramble?: (s: string) => void;
  onManualTime: (ms: number) => void;
}

type View = 'menu' | 'edit' | 'manual';

export default function ScrambleActionSheet({
  open,
  onClose,
  showPreview,
  onTogglePreview,
  onSetCustomScramble,
  onManualTime,
}: ScrambleActionSheetProps) {
  const { t } = useTranslation();
  const [view, setView] = useState<View>('menu');
  const [customInput, setCustomInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const parsedTime = parseTimeInput(timeInput);

  const handleClose = () => {
    onClose();
    // Reset internal view state on next open
    setTimeout(() => {
      setView('menu');
      setCustomInput('');
      setTimeInput('');
    }, 200);
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={handleClose}
      slotProps={{
        paper: {
          sx: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            pb: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
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
          mb: 1.5,
        }}
      />

      <Box sx={{ px: 2 }}>
        <Typography
          sx={{
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontSize: '0.65rem',
            fontWeight: 700,
            color: 'text.secondary',
            mb: 1.5,
            textAlign: 'center',
          }}>
          {t('settings.scrambleActions')}
        </Typography>

        {view === 'menu' && (
          <Stack spacing={1} sx={{ pb: 2 }}>
            <ActionRow
              icon={showPreview ? <VisibilityIcon /> : <VisibilityOffIcon />}
              label={t('settings.scrambleAction3DPreview')}
              onClick={() => {
                onTogglePreview();
                handleClose();
              }}
              active={showPreview}
            />
            {onSetCustomScramble && (
              <ActionRow
                icon={<EditIcon />}
                label={t('settings.scrambleActionEdit')}
                onClick={() => setView('edit')}
              />
            )}
            <ActionRow
              icon={<MoreTimeIcon />}
              label={t('settings.scrambleActionManualTime')}
              onClick={() => setView('manual')}
            />
          </Stack>
        )}

        {view === 'edit' && (
          <Box sx={{ pb: 2 }}>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 1 }}>
              {t('timer.enterCustomScramble')}
            </Typography>
            <TextField
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && customInput.trim()) {
                  onSetCustomScramble?.(customInput.trim());
                  handleClose();
                }
                e.stopPropagation();
              }}
              placeholder="R U R' F2 D' L2 B..."
              size="small"
              fullWidth
              autoFocus
              slotProps={{
                htmlInput: {
                  style: {
                    fontFamily: 'monospace',
                    fontSize: '0.95rem',
                    letterSpacing: '0.04em',
                  },
                },
              }}
              sx={{ mb: 1.5 }}
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                onClick={() => setView('menu')}
                sx={{ textTransform: 'none' }}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="contained"
                disabled={!customInput.trim()}
                onClick={() => {
                  onSetCustomScramble?.(customInput.trim());
                  handleClose();
                }}
                sx={{ textTransform: 'none' }}>
                {t('common.confirm')}
              </Button>
            </Stack>
          </Box>
        )}

        {view === 'manual' && (
          <Box sx={{ pb: 2 }}>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 1 }}>
              {t('timer.enterManualTime')}
            </Typography>
            <TextField
              value={timeInput}
              onChange={e => setTimeInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && parsedTime) {
                  onManualTime(parsedTime);
                  handleClose();
                }
                e.stopPropagation();
              }}
              placeholder="1080 → 10.80"
              size="small"
              fullWidth
              autoFocus
              inputMode="numeric"
              slotProps={{
                htmlInput: {
                  style: {
                    fontFamily: 'monospace',
                    fontSize: '1.1rem',
                    letterSpacing: '0.04em',
                    textAlign: 'center',
                  },
                },
              }}
              sx={{ mb: 0.75 }}
            />
            {timeInput && (
              <Typography
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: parsedTime ? 'primary.main' : 'error.main',
                  textAlign: 'center',
                  mb: 1.5,
                }}>
                {parsedTime ? formatTime(parsedTime) : '—'}
              </Typography>
            )}
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                onClick={() => setView('menu')}
                sx={{ textTransform: 'none' }}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="contained"
                disabled={!parsedTime}
                onClick={() => {
                  if (parsedTime) {
                    onManualTime(parsedTime);
                    handleClose();
                  }
                }}
                sx={{ textTransform: 'none' }}>
                {t('common.confirm')}
              </Button>
            </Stack>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}

function ActionRow({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 1.5,
        px: 2,
        py: 1.75,
        borderRadius: 2,
        border: '1px solid',
        borderColor: active ? 'primary.main' : 'divider',
        bgcolor: active ? 'rgba(255, 105, 180, 0.08)' : 'transparent',
        color: active ? 'primary.main' : 'text.primary',
        textAlign: 'left',
        width: '100%',
        minHeight: 52,
        transition: 'all 0.15s',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'rgba(255, 105, 180, 0.06)',
        },
      }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          color: active ? 'primary.main' : 'text.secondary',
        }}>
        {icon}
      </Box>
      <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, flex: 1 }}>
        {label}
      </Typography>
    </ButtonBase>
  );
}
