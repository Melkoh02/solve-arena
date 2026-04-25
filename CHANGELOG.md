# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.0]: https://github.com/Melkoh02/solve-arena/releases/tag/v1.0.0
