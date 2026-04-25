import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Popover,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import MoreTimeIcon from '@mui/icons-material/MoreTime';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { formatTime } from '../../lib/utils/formatTime';
import { matchesShortcut } from '../../lib/utils/shortcuts';
import { useStore } from '../../lib/hooks/useStore';
import ScramblePreview from './ScramblePreview';

/**
 * Parse a raw time input into milliseconds.
 * Input is treated as centiseconds when no decimal:
 *   75 → 0.75s (750ms), 1080 → 10.80s (10800ms), 12540 → 1:25.40 (85400ms)
 * With decimal: treated as seconds: 0.75 → 750ms, 10.80 → 10800ms
 */
const MAX_TIME_MS = 3_599_990; // 59:59.99

function parseTimeInput(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let ms: number;

  // If has a decimal point, treat as seconds
  if (trimmed.includes('.')) {
    const secs = parseFloat(trimmed);
    if (isNaN(secs) || secs <= 0) return null;
    ms = Math.round(secs * 1000);
  } else if (trimmed.includes(':')) {
    // If has a colon, parse as m:ss.cc
    const parts = trimmed.split(':');
    if (parts.length !== 2) return null;
    const mins = parseInt(parts[0], 10);
    const rest = parseFloat(parts[1]);
    if (isNaN(mins) || isNaN(rest)) return null;
    ms = Math.round((mins * 60 + rest) * 1000);
  } else {
    // Raw digits → last 2 are centiseconds, next 2 seconds, rest minutes
    const digits = trimmed.replace(/\D/g, '');
    if (!digits || digits === '0') return null;
    const num = parseInt(digits, 10);
    const cs = num % 100;
    const secs = Math.floor(num / 100) % 100;
    const mins = Math.floor(num / 10000);
    ms = (mins * 60000) + (secs * 1000) + (cs * 10);
  }

  if (ms <= 0) return null;
  if (ms > MAX_TIME_MS) return null;
  return ms;
}

const PREVIEW_KEY = 'scramblePreviewVisible';

interface ScrambleDisplayProps {
  scramble: string;
  eventId?: string;
  isLoading?: boolean;
  isCustom?: boolean;
  onSetCustom?: (scramble: string) => void;
  onClearCustom?: () => void;
  onManualTime?: (timeMs: number) => void;
}

const ScrambleDisplay = observer(function ScrambleDisplay({
  scramble,
  eventId = '333',
  isLoading = false,
  isCustom = false,
  onSetCustom,
  onClearCustom,
  onManualTime,
}: ScrambleDisplayProps) {
  const { t } = useTranslation();
  const { settingsStore } = useStore();
  const [showPreview, setShowPreview] = useState(() => {
    try {
      return localStorage.getItem(PREVIEW_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [editAnchor, setEditAnchor] = useState<HTMLElement | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [timeAnchor, setTimeAnchor] = useState<HTMLElement | null>(null);
  const [timeInput, setTimeInput] = useState('');
  const parsedTime = parseTimeInput(timeInput);

  const togglePreview = () => {
    setShowPreview(prev => {
      const next = !prev;
      try {
        localStorage.setItem(PREVIEW_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Keyboard shortcut: hold = temporary preview, ctrl-variant = toggle
  const holdPreviewRef = useRef(false);
  const holdBinding = settingsStore.shortcuts.holdScramblePreview;
  const toggleBinding = settingsStore.shortcuts.toggleScramblePreview;
  useEffect(() => {
    const INTERACTIVE = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
    const handleDown = (e: KeyboardEvent) => {
      if (INTERACTIVE.has((e.target as HTMLElement).tagName)) return;
      // Toggle is checked first because it has stricter modifiers
      if (matchesShortcut(e, toggleBinding)) {
        e.preventDefault();
        togglePreview();
        return;
      }
      if (matchesShortcut(e, holdBinding)) {
        if (e.repeat) return;
        e.preventDefault();
        holdPreviewRef.current = true;
        setShowPreview(true);
      }
    };
    const handleUp = (e: KeyboardEvent) => {
      // Use just the key portion of the hold binding so release fires regardless of modifiers
      if (e.key.toLowerCase() !== holdBinding.key.toLowerCase()) return;
      if (!holdPreviewRef.current) return;
      holdPreviewRef.current = false;
      const persisted = localStorage.getItem(PREVIEW_KEY) === 'true';
      setShowPreview(persisted);
    };
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, [holdBinding, toggleBinding]);

  const handleApplyCustom = () => {
    if (customInput.trim() && onSetCustom) {
      onSetCustom(customInput.trim());
      setEditAnchor(null);
      setCustomInput('');
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 90, mb: 2 }}>
        <CircularProgress size={20} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ textAlign: 'center', mb: 2, maxWidth: '100%', minHeight: 90 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
          mb: 1,
        }}>
        <Typography
          sx={{
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontSize: '0.6rem',
            fontWeight: 700,
            color: isCustom ? 'primary.main' : 'text.secondary',
          }}>
          {isCustom ? t('timer.customScramble') : t('timer.scrambleLabel')}
        </Typography>
        <IconButton
          size="small"
          onClick={togglePreview}
          sx={{
            p: 0.25,
            color: showPreview ? 'primary.main' : 'text.secondary',
            opacity: showPreview ? 1 : 0.5,
            transition: 'color 0.2s, opacity 0.2s',
            '&:hover': { opacity: 1 },
          }}>
          {showPreview ? (
            <VisibilityIcon sx={{ fontSize: 14 }} />
          ) : (
            <VisibilityOffIcon sx={{ fontSize: 14 }} />
          )}
        </IconButton>
        {onSetCustom && (
          <IconButton
            size="small"
            onClick={e => {
              setCustomInput('');
              setEditAnchor(e.currentTarget);
            }}
            sx={{
              p: 0.25,
              color: isCustom ? 'primary.main' : 'text.secondary',
              opacity: isCustom ? 1 : 0.5,
              '&:hover': { opacity: 1 },
            }}>
            <EditIcon sx={{ fontSize: 14 }} />
          </IconButton>
        )}
        {onManualTime && (
          <IconButton
            size="small"
            onClick={e => {
              setTimeInput('');
              setTimeAnchor(e.currentTarget);
            }}
            sx={{
              p: 0.25,
              color: 'text.secondary',
              opacity: 0.5,
              '&:hover': { opacity: 1 },
            }}>
            <MoreTimeIcon sx={{ fontSize: 14 }} />
          </IconButton>
        )}
      </Box>
      <Box
        sx={{
          display: 'inline-block',
          maxWidth: '100%',
          px: { xs: 2, md: 3 },
          py: 1.5,
          borderRadius: 2,
          bgcolor: isCustom ? 'rgba(255, 105, 180, 0.08)' : 'rgba(255, 105, 180, 0.04)',
          border: '1px solid',
          borderColor: isCustom ? 'primary.main' : 'divider',
        }}>
        <Typography
          sx={{
            fontFamily: 'monospace',
            fontSize: { xs: '0.75rem', md: '0.9rem' },
            letterSpacing: '0.06em',
            color: 'text.secondary',
            lineHeight: 1.6,
            wordBreak: 'break-word',
          }}>
          {scramble}
        </Typography>

        {showPreview && scramble && (
          <ScramblePreview scramble={scramble} eventId={eventId} />
        )}
      </Box>

      {isCustom && onClearCustom && (
        <Box sx={{ mt: 0.75 }}>
          <Button
            size="small"
            onClick={onClearCustom}
            sx={{ textTransform: 'none', fontSize: '0.65rem', color: 'text.secondary' }}>
            {t('timer.clearCustom')}
          </Button>
        </Box>
      )}

      {/* Custom scramble popover */}
      <Popover
        open={!!editAnchor}
        anchorEl={editAnchor}
        onClose={() => setEditAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            sx: {
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              mt: 1,
              width: 340,
              backgroundImage: 'none',
            },
          },
        }}>
        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, mb: 1 }}>
            {t('timer.enterCustomScramble')}
          </Typography>
          <TextField
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleApplyCustom();
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
                  fontSize: '0.85rem',
                  letterSpacing: '0.04em',
                },
              },
            }}
            sx={{ mb: 1.5 }}
          />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              size="small"
              onClick={() => setEditAnchor(null)}
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
              {t('common.cancel')}
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleApplyCustom}
              disabled={!customInput.trim()}
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
              {t('common.confirm')}
            </Button>
          </Stack>
        </Box>
      </Popover>

      {/* Manual time popover */}
      <Popover
        open={!!timeAnchor}
        anchorEl={timeAnchor}
        onClose={() => setTimeAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            sx: {
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              mt: 1,
              width: 280,
              backgroundImage: 'none',
            },
          },
        }}>
        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, mb: 1 }}>
            {t('timer.enterManualTime')}
          </Typography>
          <TextField
            value={timeInput}
            onChange={e => setTimeInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && parsedTime && onManualTime) {
                onManualTime(parsedTime);
                setTimeAnchor(null);
                setTimeInput('');
              }
              e.stopPropagation();
            }}
            placeholder="1080 → 10.80"
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
            sx={{ mb: 0.75 }}
          />
          {timeInput && (
            <Typography
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: parsedTime ? 'primary.main' : 'error.main',
                textAlign: 'center',
                mb: 1,
              }}>
              {parsedTime ? formatTime(parsedTime) : '—'}
            </Typography>
          )}
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              size="small"
              onClick={() => setTimeAnchor(null)}
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
              {t('common.cancel')}
            </Button>
            <Button
              size="small"
              variant="contained"
              disabled={!parsedTime}
              onClick={() => {
                if (parsedTime && onManualTime) {
                  onManualTime(parsedTime);
                  setTimeAnchor(null);
                  setTimeInput('');
                }
              }}
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
              {t('common.confirm')}
            </Button>
          </Stack>
        </Box>
      </Popover>
    </Box>
  );
});

export default ScrambleDisplay;
