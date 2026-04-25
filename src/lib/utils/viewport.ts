/**
 * Viewport height utilities.
 *
 * `100vh` on Android Chrome is the *largest* possible viewport (URL bar
 * hidden), so when the URL bar is visible the layout is taller than the
 * window and content at the bottom is clipped offscreen. `100dvh`
 * (Dynamic Viewport Height) adjusts to the current viewport.
 *
 * Browser support: Chrome 108+, iOS Safari 15.4+, Firefox 101+.
 * For older browsers we fall back to `100vh` via `@supports`.
 */

/** Fixed height: prefers dvh, falls back to vh. */
export const vhSafe = (vh: number) =>
  ({
    height: `${vh}vh`,
    '@supports (height: 100dvh)': { height: `${vh}dvh` },
  }) as const;

/** Minimum height: prefers dvh, falls back to vh. */
export const minVhSafe = (vh: number) =>
  ({
    minHeight: `${vh}vh`,
    '@supports (min-height: 100dvh)': { minHeight: `${vh}dvh` },
  }) as const;
