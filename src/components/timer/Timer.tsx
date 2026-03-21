import { useEffect, useRef, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { Typography, useTheme as useMuiTheme } from '@mui/material';
import { useStore } from '../../lib/hooks/useStore';
import { formatTime } from '../../lib/utils/formatTime';

const INTERACTIVE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON']);

interface TimerProps {
  disabled?: boolean;
}

/** Hook that returns touch handlers for the timer area. */
export function useTimerTouch(disabled: boolean) {
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
      }
    },
    [timerStore, animate, disabled],
  );

  return { onTouchStart, onTouchEnd };
}

const Timer = observer(function Timer({ disabled = false }: TimerProps) {
  const { timerStore } = useStore();
  const theme = useMuiTheme();
  const rafRef = useRef<number | null>(null);
  const isSpaceDown = useRef(false);

  const animate = useCallback(() => {
    if (timerStore.timerPhase === 'running' && timerStore.startTime !== null) {
      timerStore.updateDisplayTime(Date.now() - timerStore.startTime);
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [timerStore]);

  // ── Keyboard handlers ──────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (INTERACTIVE_TAGS.has((e.target as HTMLElement).tagName)) return;
      if (disabled) return;

      // Any key stops a running timer; Escape also flags as DNF
      if (timerStore.timerPhase === 'running') {
        e.preventDefault();
        timerStore.stopTimer(e.code === 'Escape');
        return;
      }

      // Only spacebar starts the ready/start flow
      if (e.code !== 'Space') return;
      e.preventDefault();

      if (!isSpaceDown.current) {
        isSpaceDown.current = true;
        timerStore.setReady();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      if (INTERACTIVE_TAGS.has((e.target as HTMLElement).tagName)) return;
      if (disabled) return;
      e.preventDefault();

      isSpaceDown.current = false;

      if (timerStore.timerPhase === 'ready') {
        timerStore.startTimer();
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [timerStore, animate, disabled]);

  const getColor = (): string => {
    switch (timerStore.timerPhase) {
      case 'ready':
        return '#4caf50';
      default:
        return theme.palette.text.primary;
    }
  };

  const getAccentColor = (): string => {
    switch (timerStore.timerPhase) {
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
    py: { xs: 2, md: 4 },
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
