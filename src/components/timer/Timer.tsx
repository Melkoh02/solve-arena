import { useEffect, useRef, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { Typography } from '@mui/material';
import { useStore } from '../../lib/hooks/useStore';
import { formatTime } from '../../lib/utils/formatTime';

const INTERACTIVE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

interface TimerProps {
  disabled?: boolean;
}

const Timer = observer(function Timer({ disabled = false }: TimerProps) {
  const { timerStore } = useStore();
  const rafRef = useRef<number | null>(null);
  const isSpaceDown = useRef(false);

  const animate = useCallback(() => {
    if (timerStore.timerPhase === 'running' && timerStore.startTime !== null) {
      timerStore.updateDisplayTime(Date.now() - timerStore.startTime);
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [timerStore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return;
      if (INTERACTIVE_TAGS.has((e.target as HTMLElement).tagName)) return;
      if (disabled) return;
      e.preventDefault();

      if (timerStore.timerPhase === 'running') {
        timerStore.stopTimer();
        return;
      }

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
      case 'running':
        return '#FF69B4';
      case 'stopped':
        return '#FF69B4';
      default:
        return '#ffffff';
    }
  };

  return (
    <Typography
      sx={{
        fontFamily: '"Inter", monospace',
        fontSize: 'clamp(3rem, 12vw, 8rem)',
        fontWeight: 900,
        textAlign: 'center',
        color: getColor(),
        userSelect: 'none',
        lineHeight: 1,
        letterSpacing: '-0.02em',
        py: { xs: 2, md: 4 },
        textShadow:
          timerStore.timerPhase === 'running'
            ? '0 0 40px rgba(255, 105, 180, 0.3)'
            : 'none',
        transition: 'color 0.15s, text-shadow 0.3s',
      }}>
      {formatTime(timerStore.displayTime)}
    </Typography>
  );
});

export default Timer;
