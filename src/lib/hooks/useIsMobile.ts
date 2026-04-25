import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useStore } from './useStore';

/**
 * True when the mobile layout should be used.
 *
 * Reads `settingsStore.layoutMode`:
 * - `auto`    — viewport-driven (`<sm` breakpoint, ~600px)
 * - `mobile`  — always true
 * - `desktop` — always false
 *
 * The consuming component must be wrapped in `observer()` for the
 * MobX read on `layoutMode` to be reactive.
 */
export function useIsMobile(): boolean {
  const { settingsStore } = useStore();
  const theme = useTheme();
  const viewportIsMobile = useMediaQuery(theme.breakpoints.down('sm'));
  if (settingsStore.layoutMode === 'mobile') return true;
  if (settingsStore.layoutMode === 'desktop') return false;
  return viewportIsMobile;
}
