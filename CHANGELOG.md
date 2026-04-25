# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-04-25

Mobile-friendly solo mode.

### Added

- **Mobile layout** for solo mode — a dedicated phone-optimized UI with thumb-sized tap targets, replacing the cramped desktop layout that was rendering on small screens. The desktop layout is unchanged.
- **Layout mode setting** in Settings → Layout: `Auto` / `Mobile` / `Desktop`. `Auto` flips to the mobile layout under the `<sm` breakpoint (~600px viewport). Persists alongside the rest of `@M003:settings`.
- **Mobile top bar** — compact: puzzle dropdown on the left, settings gear and a circular "Compete" icon button (with the live status dot) on the right. Honors `env(safe-area-inset-top)` on iOS.
- **Scramble action sheet** — bottom sheet with three labeled actions (3D Preview / Edit Scramble / Manual Entry) replacing the three tiny inline icons. The whole scramble pill is the trigger — tapping anywhere on the pill opens the sheet.
- **Card-based history** — solves render as full-width cards (index, time, date, +2/DNF toggles, cross-color swatch, delete) instead of a horizontal table. Per-solve delete confirmation is mobile-friendly (`fullWidth`, larger fonts, 96px-min buttons).
- **History bottom drawer** — peek bar at the bottom showing `HISTORY (n) · Best · Avg`; tap to expand to 85 vh. Trash (clear-all) sits in the top-left corner of the drawer header, close (X) in the top-right, so the destructive action can't be accidentally tapped instead of dismiss.
- **`large` prop on `Timer`** — the mobile layout uses `clamp(5.5rem, 28vw, 10rem)` so the timer fills the empty space on a phone instead of staying at the desktop minimum. AO5/AO12 and the previous-solves stack scale up alongside it.
- **`useIsMobile()` hook** — single source of truth that reads `settingsStore.layoutMode` and the viewport. New components use this; the existing desktop-chrome viewport heuristic in `SoloScreen` was renamed to `isNarrowViewport` to avoid confusion.

### Changed

- **`SoloSolveDetailModal`** picks up larger sizing on mobile (bigger time display, `medium`-sized penalty buttons, 32px cross-color swatch, full-width Copy/Export buttons stacked vertically). Stays a centered dialog rather than going fullScreen.
- **Clear-all confirmation dialog** in `SoloScreen` goes `fullWidth` on mobile so it has presence instead of collapsing to content width. Desktop sizing unchanged.

### Internal / Infra

- Release process now requires annotated tags (`git tag -a vX.Y.Z -m "vX.Y.Z — <title>"`) and uses `git push origin master --follow-tags` so the tag rides along with the release commit. Lightweight tags (`git tag vX.Y.Z`) are silently skipped by `--follow-tags`.
- Release process now includes a CHANGELOG update step on `master` between the merge and the tag, mirroring the my-wallet workflow.

## [1.0.0] - 2026-04-25

Initial release of Solve Arena.

### Added

#### Solo mode
- Speedcube timer with hold-to-ready flow: spacebar (instant) or color key (hold) starts the cycle, key release fires the timer.
- Cross-color tagging via the 6 color keys (W/Y/R/O/B/G) — the chosen color is recorded with the solve.
- Configurable color-key hold threshold (100–2000 ms) and a "spacebar requires hold" toggle.
- Rolling AO5 and AO12, plus all-time best and global average.
- History table with per-solve `+2` / `DNF` penalties, deletion, and a detail modal.
- Custom scramble entry and manual time entry for retroactive logging.
- 3D scramble preview (powered by `cubing`), toggleable via `E` (hold) or `Ctrl+E` (persistent).
- Personal-best snackbar notification.
- Keyboard shortcuts to delete the last solve (`Backspace`), clear all solves (`Ctrl+Shift+Backspace`), and toggle the history table (`H`, persisted).

#### Multiplayer mode
- Room-based lobbies with shareable codes, served by an Express + socket.io backend.
- Live competitor sidebar showing each player's solving / finished / waiting status per round.
- Synchronized per-round scrambles.
- Round PB notifications.
- Reconnection recovery — keeps the player's identity through socket reconnects (uses MobX-tracked `playerId`, not stale `socket.id`).

#### Settings
- Three themes: Light, Dark, Glass (the last with a `backdrop-filter` glass effect over a diagonal wallpaper gradient).
- Per-scheme palette overrides for 8 tokens — Primary, Background, Gradient accent, Surface, Text, Muted text, Success, Error. Glass exposes a second background stop for the diagonal gradient; Dark and Light use the simpler 7-token set.
- Configurable keyboard shortcuts for 11 actions (color keys, delete-last, clear-all, scramble preview hold/toggle, history toggle), with conflict detection and a "reset section" button.
- Timer precision toggle (`0.00` / `0.0`) and copy/export format toggle (`auto` / `mm:ss.xx`).
- English and Spanish localization.

#### Infrastructure
- React 19 + Vite + TypeScript on the client; MUI v7 + MobX + react-i18next.
- Express + socket.io server, deployed separately on Render via `render.yaml`.
- Client persists to `localStorage` under the `@M003:` prefix (settings, palette, theme, language, solves, selected event, player name).
- GitHub Pages deployment via GitHub Actions on every push to `master`.

### Technical Details
- React 19.2 + Vite 7
- TypeScript 5.8 in strict mode
- MUI v7 with three custom theme factories (`createDarkTheme` / `createLightTheme` / `createGlassTheme`) that take a `ThemeTokens` object so palette overrides cascade through every component-level override
- MobX 6 stores: `theme`, `settings`, `solo`, `room`, `timer`, `user`, `language`, `server`
- `cubing` 0.63 for scramble generation and the 3D preview
- socket.io 4.8 client/server
- Custom domain: `solvearena.net` (GitHub Pages CNAME)

[1.1.0]: https://github.com/Melkoh02/solve-arena/releases/tag/v1.1.0
[1.0.0]: https://github.com/Melkoh02/solve-arena/releases/tag/v1.0.0
