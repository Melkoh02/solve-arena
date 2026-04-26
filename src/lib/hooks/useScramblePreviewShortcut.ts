import { useEffect, useRef } from 'react';
import { matchesShortcut } from '../utils/shortcuts';
import { useStore } from './useStore';

type Setter = (next: boolean | ((prev: boolean) => boolean)) => void;

/**
 * Wires the configurable scramble-preview keyboard shortcuts (hold and
 * persistent toggle) to the caller's local `showPreview` state. The same
 * hook is used by the desktop `ScrambleDisplay` and the mobile layouts so
 * the shortcut works regardless of which layout is mounted (mobile mode
 * is also used on desktop for narrow / multitasking windows).
 */
export function useScramblePreviewShortcut(
  setShowPreview: Setter,
  persistKey: string,
) {
  const { settingsStore } = useStore();
  const holdBinding = settingsStore.shortcuts.holdScramblePreview;
  const toggleBinding = settingsStore.shortcuts.toggleScramblePreview;
  const holdPreviewRef = useRef(false);

  useEffect(() => {
    const INTERACTIVE = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

    const togglePreview = () => {
      setShowPreview(prev => {
        const next = !prev;
        try {
          localStorage.setItem(persistKey, String(next));
        } catch {
          // ignore
        }
        return next;
      });
    };

    const handleDown = (e: KeyboardEvent) => {
      if (INTERACTIVE.has((e.target as HTMLElement).tagName)) return;
      // Toggle is checked first because it has stricter modifiers.
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
      if (e.key.toLowerCase() !== holdBinding.key.toLowerCase()) return;
      if (!holdPreviewRef.current) return;
      holdPreviewRef.current = false;
      const persisted = localStorage.getItem(persistKey) === 'true';
      setShowPreview(persisted);
    };

    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, [holdBinding, toggleBinding, persistKey, setShowPreview]);
}
