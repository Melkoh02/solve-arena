import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

const EVENT_TO_PUZZLE: Record<string, string> = {
  '222': '2x2x2',
  '333': '3x3x3',
  '444': '4x4x4',
  '555': '5x5x5',
  '666': '6x6x6',
  '777': '7x7x7',
  '333bf': '3x3x3',
  '333fm': '3x3x3',
  '333oh': '3x3x3',
  '333mbf': '3x3x3',
  '444bf': '4x4x4',
  '555bf': '5x5x5',
  clock: 'clock',
  minx: 'megaminx',
  pyram: 'pyraminx',
  skewb: 'skewb',
  sq1: 'square1',
};

interface ScramblePreviewProps {
  scramble: string;
  eventId: string;
}

export default function ScramblePreview({
  scramble,
  eventId,
}: ScramblePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLElement | null>(null);

  const puzzleId = EVENT_TO_PUZZLE[eventId] ?? '3x3x3';

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !scramble) return;

    let cancelled = false;

    (async () => {
      const { TwistyPlayer } = await import('cubing/twisty');

      if (cancelled || !containerRef.current) return;

      // Remove previous player
      if (playerRef.current) {
        playerRef.current.remove();
        playerRef.current = null;
      }

      const player = new TwistyPlayer({
        puzzle: puzzleId,
        alg: scramble,
        visualization: '2D',
        controlPanel: 'none',
        background: 'none',
        hintFacelets: 'none',
      });

      player.style.width = '180px';
      player.style.height = '135px';

      playerRef.current = player;
      container.appendChild(player);

      // Jump to the end to show the scrambled state
      requestAnimationFrame(() => {
        if (!cancelled) {
          player.jumpToEnd();
        }
      });
    })();

    return () => {
      cancelled = true;
      if (playerRef.current) {
        playerRef.current.remove();
        playerRef.current = null;
      }
    };
  }, [scramble, puzzleId]);

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mt: 1.5,
        mx: 'auto',
      }}
    />
  );
}
