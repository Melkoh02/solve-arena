import { useEffect, useRef, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { Typography, useTheme as useMuiTheme } from '@mui/material';
import { useStore } from '../../lib/hooks/useStore';
import { formatTime } from '../../lib/utils/formatTime';
import { getColorFromEvent } from '../../lib/utils/shortcuts';
import type { CrossColor } from '../../lib/types/room';

const INTERACTIVE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON']);
const MAX_TIME_MS = 3_599_990; // 59:59.99

interface TimerProps {
  disabled?: boolean;
  onColorStart?: (color: CrossColor) => void;
  /** When true, scale the timer up — used by the mobile layout. */
  large?: boolean;
}

/** Hook that returns touch handlers for the timer area. */
export function useTimerTouch(
  disabled: boolean,
  onColorStart?: (color: CrossColor) => void,
) {
  const { timerStore, settingsStore } = useStore();
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

      // Touch during inspection arms the timer (countdown keeps ticking,
      // display turns green). Release will end inspection and start the
      // actual timer.
      if (timerStore.timerPhase === 'inspecting') {
        if (!isTouching.current) {
          isTouching.current = true;
          timerStore.armInspection();
        }
        return;
      }

      if (!isTouching.current) {
        isTouching.current = true;

        // First tap with inspection enabled: start inspection. The
        // subsequent touchend won't arm the timer because phase is
        // 'inspecting' (not 'inspecting'+armed) at release time.
        if (
          settingsStore.inspectionEnabled &&
          (timerStore.timerPhase === 'idle' ||
            timerStore.timerPhase === 'stopped')
        ) {
          timerStore.startInspection();
          return;
        }

        timerStore.setReady();
      }
    },
    [timerStore, settingsStore, disabled],
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      e.preventDefault();

      isTouching.current = false;

      // Armed during inspection: release ends inspection (records penalty
      // or force-DNF) and starts the timer.
      if (
        timerStore.timerPhase === 'inspecting' &&
        timerStore.inspectionArmed
      ) {
        const dnf = timerStore.endInspection(settingsStore.inspectionDuration);
        if (!dnf) {
          timerStore.setReady();
          timerStore.startTimer();
          rafRef.current = requestAnimationFrame(animate);
          onColorStart?.('w');
        }
        return;
      }

      if (timerStore.timerPhase === 'ready') {
        timerStore.startTimer();
        rafRef.current = requestAnimationFrame(animate);
        onColorStart?.('w');
      }
    },
    [timerStore, settingsStore, animate, disabled, onColorStart],
  );

  return { onTouchStart, onTouchEnd };
}

const Timer = observer(function Timer({
  disabled = false,
  onColorStart,
  large = false,
}: TimerProps) {
  const { timerStore, settingsStore } = useStore();
  const theme = useMuiTheme();
  const rafRef = useRef<number | null>(null);
  const inspectionRafRef = useRef<number | null>(null);
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

  const stopInspectionRaf = useCallback(() => {
    if (inspectionRafRef.current !== null) {
      cancelAnimationFrame(inspectionRafRef.current);
      inspectionRafRef.current = null;
    }
  }, []);

  // ── Inspection RAF loop ────────────────────────────────
  // Runs while phase === 'inspecting'. Updates elapsed time each frame and
  // triggers an automatic DNF when the cuber overruns by more than 2s.
  useEffect(() => {
    if (timerStore.timerPhase !== 'inspecting') {
      stopInspectionRaf();
      return;
    }

    const dnfThresholdMs = (settingsStore.inspectionDuration + 2) * 1000;

    const tick = () => {
      if (timerStore.timerPhase !== 'inspecting') {
        inspectionRafRef.current = null;
        return;
      }
      timerStore.tickInspection();
      if (timerStore.inspectionElapsedMs > dnfThresholdMs) {
        timerStore.forceDnfFromInspection();
        inspectionRafRef.current = null;
        return;
      }
      inspectionRafRef.current = requestAnimationFrame(tick);
    };

    inspectionRafRef.current = requestAnimationFrame(tick);
    return () => stopInspectionRaf();
  }, [
    timerStore,
    timerStore.timerPhase,
    settingsStore.inspectionDuration,
    stopInspectionRaf,
  ]);

  // ── Keyboard handlers ──────────────────────────────────

  useEffect(() => {
    const isInsideOverlay = (target: EventTarget | null) =>
      !!(target as HTMLElement)?.closest?.(
        '[role="dialog"], [role="presentation"], .MuiPopover-root',
      );

    const beginPrepareOrReady = (isSpace: boolean) => {
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
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (isInsideOverlay(e.target)) return;
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      // Space activates focused buttons (and ButtonBase divs with role=button)
      // on keyup. preventDefault on keydown alone isn't enough because each
      // event has its own defaultPrevented flag — so we also blur the
      // focused element. The keyup then fires on body, and the button's
      // activation handler never sees it.
      const isButtonLike =
        tag === 'BUTTON' || target.getAttribute('role') === 'button';
      if (e.code === 'Space' && isButtonLike) {
        e.preventDefault();
        target.blur();
      } else if (INTERACTIVE_TAGS.has(tag)) {
        return;
      }
      if (disabled) return;

      // Escape during inspection cancels back to idle
      if (e.code === 'Escape' && timerStore.timerPhase === 'inspecting') {
        e.preventDefault();
        timerStore.cancelInspection();
        isKeyDown.current = false;
        return;
      }

      // Escape cancels preparing, ready, or resets stopped to idle
      if (
        e.code === 'Escape' &&
        (timerStore.timerPhase === 'preparing' ||
          timerStore.timerPhase === 'ready' ||
          timerStore.timerPhase === 'stopped')
      ) {
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

      // Backspace / Delete during a running solve cancels it: timer aborts
      // and no solve is recorded. After the solve is submitted, the existing
      // per-solve delete UI is what the user reaches for.
      if (
        timerStore.timerPhase === 'running' &&
        (e.code === 'Backspace' || e.code === 'Delete')
      ) {
        e.preventDefault();
        timerStore.cancelRunning();
        stopTimestamp.current = Date.now();
        isKeyDown.current = false;
        clearHoldTimer();
        return;
      }

      // Most keys stop a running timer; Escape also flags as DNF.
      // Modifier-only keys (Ctrl, Alt, Shift, Meta, Tab, CapsLock, F1-F12) are
      // ignored so system shortcuts / app focus changes don't stop the timer.
      if (timerStore.timerPhase === 'running') {
        const IGNORE = new Set([
          'ControlLeft',
          'ControlRight',
          'AltLeft',
          'AltRight',
          'ShiftLeft',
          'ShiftRight',
          'MetaLeft',
          'MetaRight',
          'Tab',
          'CapsLock',
          'ContextMenu',
          'F1',
          'F2',
          'F3',
          'F4',
          'F5',
          'F6',
          'F7',
          'F8',
          'F9',
          'F10',
          'F11',
          'F12',
        ]);
        if (IGNORE.has(e.code)) return;
        e.preventDefault();
        timerStore.stopTimer(e.code === 'Escape');
        stopTimestamp.current = Date.now();
        const stopColorKey = getColorFromEvent(e, settingsStore.shortcuts);
        isKeyDown.current = e.code === 'Space' || !!stopColorKey;
        clearHoldTimer();
        return;
      }

      const colorKey = getColorFromEvent(e, settingsStore.shortcuts);
      const isSpace = e.code === 'Space';

      // Inspecting → arm the timer. The countdown KEEPS ticking; release
      // ends inspection and starts the timer. Either space or a color key
      // can arm — the color key (if any) is captured for the cross color.
      if (timerStore.timerPhase === 'inspecting') {
        if (!isSpace && !colorKey) return;
        e.preventDefault();
        if (!isKeyDown.current) {
          isKeyDown.current = true;
          pendingColorRef.current = colorKey ?? 'w';
          timerStore.armInspection();
        }
        return;
      }

      // Spacebar or color keys start the preparing/ready/start flow
      if (!isSpace && !colorKey) return;
      e.preventDefault();

      // Guard: ignore presses within 300ms of stopping
      if (Date.now() - stopTimestamp.current < 300) return;

      if (!isKeyDown.current) {
        // With inspection enabled, only spacebar starts the inspection.
        // Color keys in idle/stopped are ignored — they're for arming the
        // timer once inspection has begun, where they also set the cross
        // color of the upcoming solve.
        if (settingsStore.inspectionEnabled) {
          if (!isSpace) return;
          if (
            timerStore.timerPhase === 'idle' ||
            timerStore.timerPhase === 'stopped'
          ) {
            isKeyDown.current = true;
            pendingColorRef.current = 'w';
            timerStore.startInspection();
          }
          return;
        }

        isKeyDown.current = true;
        pendingColorRef.current = colorKey ?? 'w';
        beginPrepareOrReady(isSpace);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const colorKey = getColorFromEvent(e, settingsStore.shortcuts);
      const isSpace = e.code === 'Space';
      if (!isSpace && !colorKey) return;
      if (isInsideOverlay(e.target)) return;
      if (INTERACTIVE_TAGS.has((e.target as HTMLElement).tagName)) return;

      // Always reset key state on release, even when disabled,
      // to prevent stale isKeyDown blocking the next press.
      isKeyDown.current = false;
      clearHoldTimer();

      if (disabled) return;
      e.preventDefault();

      // Armed during inspection: release ends inspection (records penalty,
      // exits to 'idle' or 'stopped'+DNF) and starts the timer. The cross
      // color was captured at arm-time in pendingColorRef.
      if (
        timerStore.timerPhase === 'inspecting' &&
        timerStore.inspectionArmed
      ) {
        const dnf = timerStore.endInspection(settingsStore.inspectionDuration);
        if (!dnf) {
          timerStore.setReady();
          timerStore.startTimer();
          rafRef.current = requestAnimationFrame(animate);
          onColorStart?.(pendingColorRef.current ?? 'w');
        }
        return;
      }

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
  }, [
    timerStore,
    settingsStore,
    settingsStore.colorKeyHoldThreshold,
    settingsStore.spacebarRequiresHold,
    settingsStore.shortcuts,
    settingsStore.inspectionEnabled,
    settingsStore.inspectionDuration,
    animate,
    disabled,
    onColorStart,
  ]);

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

  const baseSx = {
    fontFamily: '"Inter", monospace',
    fontSize: large ? 'clamp(5.5rem, 28vw, 10rem)' : 'clamp(3rem, 12vw, 8rem)',
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

  // Inspecting phase: show countdown number (or "+1" / "+2" overrun marker).
  // Color priority: red overrun > green armed > orange counting.
  if (timerStore.timerPhase === 'inspecting') {
    const duration = settingsStore.inspectionDuration;
    const elapsedSec = timerStore.inspectionElapsedMs / 1000;
    const remaining = duration - elapsedSec;
    let label: string;
    let color: string;
    if (remaining > 0) {
      label = String(Math.ceil(remaining));
      color = timerStore.inspectionArmed ? '#4caf50' : '#ffa726';
    } else {
      const overrun = -remaining;
      label = overrun <= 1 ? '+1' : '+2';
      color = '#f44336';
    }
    return <Typography sx={{ ...baseSx, color }}>{label}</Typography>;
  }

  const timeStr = formatTime(
    timerStore.displayTime,
    settingsStore.timerPrecision,
  );
  const dotIndex = timeStr.lastIndexOf('.');
  const intPart = dotIndex >= 0 ? timeStr.slice(0, dotIndex) : timeStr;
  const decPart = dotIndex >= 0 ? timeStr.slice(dotIndex) : '';

  if (timerStore.showDnf && timerStore.timerPhase === 'stopped') {
    return <Typography sx={{ ...baseSx, color: '#f44336' }}>DNF</Typography>;
  }

  return (
    <Typography sx={{ ...baseSx, color: getColor() }}>
      {intPart}
      <Typography
        component="span"
        sx={{ ...baseSx, color: getAccentColor(), fontSize: 'inherit', py: 0 }}>
        {decPart}
      </Typography>
    </Typography>
  );
});

export default Timer;
