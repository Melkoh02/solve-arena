import { useEffect, useRef, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { Typography, useTheme as useMuiTheme } from '@mui/material';
import { useStore } from '../../lib/hooks/useStore';
import { formatTime } from '../../lib/utils/formatTime';
import type { CrossColor } from '../../lib/types/room';

const INTERACTIVE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON']);
const MAX_TIME_MS = 3_599_990; // 59:59.99

const COLOR_KEYS: Record<string, CrossColor> = {
  w: 'w', y: 'y', r: 'r', o: 'o', b: 'b', g: 'g',
};

interface TimerProps {
  disabled?: boolean;
  onColorStart?: (color: CrossColor) => void;
}

/** Hook that returns touch handlers for the timer area. */
export function useTimerTouch(disabled: boolean, onColorStart?: (color: CrossColor) => void) {
  const { timerStore } = useStore();
  const rafRef = useRef<number | null>(null);
  const isTouching = useRef(false);

  const animate = useCallback(() => {
    if (timerStore.timerPhase === 'running' && timerStore.startTime !== null) {
      const elapsed = Date.now() - timerStore.startTime;
      if (elapsed >= MAX_TIME_MS) {
        timerStore.stopTimer();
        return;
      }
      timerStore.updateDisplayTime(elapsed);
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [timerStore]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      e.preventDefault();

      if (timerStore.timerPhase === 'running') {
        timerStore.stopTimer();
        return;
      }

      if (!isTouching.current) {
        isTouching.current = true;
        timerStore.setReady();
      }
    },
    [timerStore, disabled],
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      e.preventDefault();

      isTouching.current = false;

      if (timerStore.timerPhase === 'ready') {
        timerStore.startTimer();
        rafRef.current = requestAnimationFrame(animate);
        onColorStart?.('w');
      }
    },
    [timerStore, animate, disabled, onColorStart],
  );

  return { onTouchStart, onTouchEnd };
}

const Timer = observer(function Timer({ disabled = false, onColorStart }: TimerProps) {
  const { timerStore, settingsStore } = useStore();
  const theme = useMuiTheme();
  const rafRef = useRef<number | null>(null);
  const isKeyDown = useRef(false);
  const pendingColorRef = useRef<CrossColor | null>(null);
  const stopTimestamp = useRef(0);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animate = useCallback(() => {
    if (timerStore.timerPhase === 'running' && timerStore.startTime !== null) {
      const elapsed = Date.now() - timerStore.startTime;
      if (elapsed >= MAX_TIME_MS) {
        timerStore.stopTimer();
        return;
      }
      timerStore.updateDisplayTime(elapsed);
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [timerStore]);

  const clearHoldTimer = () => {
    if (holdTimerRef.current !== null) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  // ── Keyboard handlers ──────────────────────────────────

  useEffect(() => {
    const isInsideOverlay = (target: EventTarget | null) =>
      !!(target as HTMLElement)?.closest?.('[role="dialog"], [role="presentation"], .MuiPopover-root');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (isInsideOverlay(e.target)) return;
      const tag = (e.target as HTMLElement).tagName;
      if (e.code === 'Space' && tag === 'BUTTON') {
        e.preventDefault();
        (e.target as HTMLElement).blur();
      } else if (INTERACTIVE_TAGS.has(tag)) {
        return;
      }
      if (disabled) return;

      // Escape cancels preparing, ready, or resets stopped to idle
      if (e.code === 'Escape' && (timerStore.timerPhase === 'preparing' || timerStore.timerPhase === 'ready' || timerStore.timerPhase === 'stopped')) {
        e.preventDefault();
        clearHoldTimer();
        if (timerStore.timerPhase === 'stopped') {
          timerStore.resetToIdle();
        } else {
          timerStore.cancelPreparing();
        }
        isKeyDown.current = false;
        return;
      }

      // Any key stops a running timer; Escape also flags as DNF
      if (timerStore.timerPhase === 'running') {
        e.preventDefault();
        timerStore.stopTimer(e.code === 'Escape');
        stopTimestamp.current = Date.now();
        // Only mark key as down if it's a key we handle on keyup (space/color).
        // Otherwise the keyup won't reset it and the next press gets blocked.
        const stopColorKey = COLOR_KEYS[e.key.toLowerCase()];
        isKeyDown.current = e.code === 'Space' || !!stopColorKey;
        clearHoldTimer();
        return;
      }

      // Spacebar or color keys start the preparing/ready/start flow
      const colorKey = COLOR_KEYS[e.key.toLowerCase()];
      const isSpace = e.code === 'Space';
      if (!isSpace && !colorKey) return;
      e.preventDefault();

      // Guard: ignore presses within 300ms of stopping
      if (Date.now() - stopTimestamp.current < 300) return;

      if (!isKeyDown.current) {
        isKeyDown.current = true;
        pendingColorRef.current = colorKey ?? 'w';

        if (isSpace && !settingsStore.spacebarRequiresHold) {
          // Space key goes straight to ready (green) with no delay
          timerStore.setReady();
        } else {
          // Enter preparing (red), then ready (green) after hold threshold
          timerStore.setPreparing();
          clearHoldTimer();
          holdTimerRef.current = setTimeout(() => {
            timerStore.setReady();
          }, settingsStore.colorKeyHoldThreshold);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const colorKey = COLOR_KEYS[e.key.toLowerCase()];
      const isSpace = e.code === 'Space';
      if (!isSpace && !colorKey) return;
      if (isInsideOverlay(e.target)) return;
      if (INTERACTIVE_TAGS.has((e.target as HTMLElement).tagName)) return;
      if (disabled) return;
      e.preventDefault();

      isKeyDown.current = false;
      clearHoldTimer();

      if (timerStore.timerPhase === 'ready') {
        // Held long enough → start timer
        timerStore.startTimer();
        rafRef.current = requestAnimationFrame(animate);
        onColorStart?.(pendingColorRef.current ?? 'w');
      } else if (timerStore.timerPhase === 'preparing') {
        // Released too early → cancel, assign color to last solve
        timerStore.cancelPreparing();
        if (colorKey) {
          onColorStart?.(colorKey);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      clearHoldTimer();
    };
  }, [timerStore, settingsStore.colorKeyHoldThreshold, settingsStore.spacebarRequiresHold, animate, disabled, onColorStart]);

  const getColor = (): string => {
    switch (timerStore.timerPhase) {
      case 'preparing':
        return '#f44336';
      case 'ready':
        return '#4caf50';
      default:
        return theme.palette.text.primary;
    }
  };

  const getAccentColor = (): string => {
    switch (timerStore.timerPhase) {
      case 'preparing':
        return '#f44336';
      case 'ready':
        return '#4caf50';
      default:
        return theme.palette.primary.main;
    }
  };

  const timeStr = formatTime(timerStore.displayTime, settingsStore.timerPrecision);
  const dotIndex = timeStr.lastIndexOf('.');
  const intPart = dotIndex >= 0 ? timeStr.slice(0, dotIndex) : timeStr;
  const decPart = dotIndex >= 0 ? timeStr.slice(dotIndex) : '';

  const baseSx = {
    fontFamily: '"Inter", monospace',
    fontSize: 'clamp(3rem, 12vw, 8rem)',
    fontWeight: 900,
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'center',
    userSelect: 'none',
    lineHeight: 1,
    letterSpacing: '-0.02em',
    py: { xs: 1, md: 2 },
    textShadow:
      timerStore.timerPhase === 'running'
        ? '0 0 40px rgba(255, 105, 180, 0.3)'
        : 'none',
    transition: 'color 0.15s, text-shadow 0.3s',
  } as const;

  if (timerStore.showDnf && timerStore.timerPhase === 'stopped') {
    return (
      <Typography sx={{ ...baseSx, color: '#f44336' }}>
        DNF
      </Typography>
    );
  }

  return (
    <Typography sx={{ ...baseSx, color: getColor() }}>
      {intPart}
      <Typography component="span" sx={{ ...baseSx, color: getAccentColor(), fontSize: 'inherit', py: 0 }}>
        {decPart}
      </Typography>
    </Typography>
  );
});

export default Timer;
