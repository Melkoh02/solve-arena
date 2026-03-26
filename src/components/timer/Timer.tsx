import { useEffect, useRef, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { Typography, useTheme as useMuiTheme } from '@mui/material';
import { useStore } from '../../lib/hooks/useStore';
import { formatTime } from '../../lib/utils/formatTime';
import type { CrossColor } from '../../lib/types/room';

const INTERACTIVE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON']);

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
      timerStore.updateDisplayTime(Date.now() - timerStore.startTime);
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

const HOLD_THRESHOLD = 1000;

const Timer = observer(function Timer({ disabled = false, onColorStart }: TimerProps) {
  const { timerStore } = useStore();
  const theme = useMuiTheme();
  const rafRef = useRef<number | null>(null);
  const isKeyDown = useRef(false);
  const pendingColorRef = useRef<CrossColor | null>(null);
  const stopTimestamp = useRef(0);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animate = useCallback(() => {
    if (timerStore.timerPhase === 'running' && timerStore.startTime !== null) {
      timerStore.updateDisplayTime(Date.now() - timerStore.startTime);
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (INTERACTIVE_TAGS.has((e.target as HTMLElement).tagName)) return;
      if (disabled) return;

      // Escape cancels preparing or ready
      if (e.code === 'Escape' && (timerStore.timerPhase === 'preparing' || timerStore.timerPhase === 'ready')) {
        e.preventDefault();
        clearHoldTimer();
        timerStore.cancelPreparing();
        isKeyDown.current = false;
        return;
      }

      // Any key stops a running timer; Escape also flags as DNF
      if (timerStore.timerPhase === 'running') {
        e.preventDefault();
        timerStore.stopTimer(e.code === 'Escape');
        stopTimestamp.current = Date.now();
        isKeyDown.current = true;
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

        // Enter preparing (red) immediately
        timerStore.setPreparing();

        // After hold threshold, transition to ready (green)
        clearHoldTimer();
        holdTimerRef.current = setTimeout(() => {
          timerStore.setReady();
        }, HOLD_THRESHOLD);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const colorKey = COLOR_KEYS[e.key.toLowerCase()];
      const isSpace = e.code === 'Space';
      if (!isSpace && !colorKey) return;
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
  }, [timerStore, animate, disabled, onColorStart]);

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

  const timeStr = formatTime(timerStore.displayTime);
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
