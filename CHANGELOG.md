# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.5] - 2026-04-26

Vendor chunk splitting for better cache reuse across deploys.

### Changed

- **Production build splits MUI/Emotion, MobX, react-router, and i18next into their own content-hashed chunks** via `manualChunks` in `vite.config.ts`. Returning visitors keep ~159 KB gzip of vendor code cached across deploys instead of re-downloading the full main bundle whenever app code changes. No user-visible behavior change — same first-load size, same lazy-loading of `cubing/twisty` and `cubing/scramble`.

## [1.3.4] - 2026-04-26

Glass is now the default theme for new visitors.

### Changed

- **First-time visitors now land on the glass theme.** Previously the default tracked the OS `prefers-color-scheme` (dark or light) when no `@M003:user-theme` was saved. Existing users with a saved theme are unaffected; only first-time visitors see the change. Also dropped the `prefers-color-scheme` `matchMedia` change listener that previously flipped a default-themed user between dark and light when their OS toggled — with glass as the default, that auto-flip would have yanked the user off glass on system pref changes.

## [1.3.3] - 2026-04-26

Polish for the multiplayer mobile history bottomsheet.

### Fixed

- **Round pill in the mobile multiplayer history bottomsheet ended at the viewport edge in 3+ player rooms, with the trailing player cells visibly spilling out the right side when scrolled.** The outer `Stack` in `MobileResultsList` was sized to its scroll container's width (block-default 100%), so each `RoundCard`'s flex-stretch made the pill exactly viewport-wide while the inner row of player cells exceeded that. Sizing the outer Stack to `width: max-content, minWidth: 100%` lets the pill stretch to encompass every player cell when the row overflows horizontally, while still filling the viewport in narrow-content cases.
- **Time column in the mobile multiplayer history rows wasn't aligned across rows.** The time `Typography` had no fixed width, so the +2 / DNF / picker / color-square columns shifted horizontally between rows depending on whether the time was 4 chars (`9.42`) or 5 (`10.80`). Reserved a `4.5rem` `minWidth` on the time element so the trailing controls now line up consistently across rows.
- **Own-row color picker sat at the end of the row, immediately adjacent to the next player's color marker on horizontal scroll** — the two circles were easy to confuse. Moved the picker to immediately after the time so it visually groups with one's own data, and dropped its size from 22px to 18px to match the other players' color square.



Mobile-mode polish across history, timer keys, and scramble preview.

### Fixed

- **Scramble preview shortcut (`E` hold / `Ctrl+E` toggle) didn't work on mobile.** The keyboard handler was inline in `ScrambleDisplay`, which is only mounted on the desktop layout — the mobile path renders `MobileScramblePanel` instead, so the shortcut was effectively unbound whenever `useIsMobile()` returned `true` (auto on narrow viewports, or whenever the user explicitly chose Mobile in Settings). Extracted the handler into a shared `useScramblePreviewShortcut` hook used by both the desktop `ScrambleDisplay` and the mobile `MobileSoloLayout` / `MobileRoomLayout`. Same-tab `localStorage` updates don't fire `storage` events, so the previous attempted sync-via-storage was always going to miss; the shared hook avoids that path entirely.
- **Tapping the mobile scramble pill, then pressing space, fired both the timer AND the bottom sheet.** `MobileScramblePanel` uses `<ButtonBase component="div">`, which renders a `<div role="button">`. The Timer's keydown blur logic only checked `tag === 'BUTTON'`, so the div retained focus across the tap; on the next space press, ButtonBase's keyup activated `onClick` (re-opened the sheet) while the Timer also processed the keypress. Now Timer also blurs elements with `role="button"`, so the keyup fires on body and ButtonBase's activation never sees it.
- **Mobile history infinite scroll only loaded one page.** The `IntersectionObserver` setup used `useRef` for both the sentinel and the scroll container, but MUI's `Drawer` lazily mounts its paper (`keepMounted: false`); the effect ran once with both refs still `null`, hit the early-return, and never re-ran because refs aren't reactive. Switching to callback refs backed by `useState` makes the elements reactive — when React attaches them, the effect re-runs with the real DOM nodes and the observer is created.
- **Mobile history drawer had a vast scrollable empty area below the last card.** A 1px `<Box>` was used as the IO sentinel; the combination of single-pixel target + `IntersectionObserver` + `rootMargin: 300px` interacted unpredictably and inflated `scrollHeight` past actual content, letting the user scroll indefinitely past `#1` into a completely empty region. Bumping the sentinel to 8px (still visually negligible against the existing card spacing) makes the layout deterministic. Restructured the drawer body to use CSS Grid (`gridTemplateRows: 'auto auto minmax(0, 1fr)'`) for rigid row sizing, and added `overscrollBehavior: 'contain'` to the scroll container to prevent scroll chaining. Same fix applied to multiplayer's `MobileResultsList`.

### Internal / Infra

- **CLAUDE.md** now documents two new conventions: deploys require explicit user consent (label like "asap"/"urgent" applies to the fix, not the push), and changes must consider mobile parity (the mobile layout is also used on narrow desktop windows, so any handler / focus / shortcut behavior needs equivalent coverage in both layouts). Also added: debug instrumentation (color paints, console.logs, large sentinels) never lands on `develop` — debug branches stay local; the actual fix goes onto a fresh `fix/*` branch.

## [1.3.1] - 2026-04-25

### Fixed

- **Mobile history drawer's infinite scroll stalled after the first batch and left empty space below the last card.** Two compounding bugs:
  - The cards `Box` in the solo drawer was missing `minHeight: 0`. Without it, flex children default to `min-height: auto` (= content size), so the inner scroll container couldn't shrink to its flex parent's bounds — causing the whole drawer to scroll instead of the cards box, and leaving empty space below the loaded cards when content was short. (Multiplayer's drawer already had this set.)
  - The `IntersectionObserver` was using the implicit viewport root with no `rootMargin`. Once the first batch had rendered, the sentinel-vs-viewport intersection math went unreliable inside the nested scroll container, so subsequent pages never triggered. Both solo and multiplayer drawers now scope the observer to their own scroll container and use `rootMargin: 300px` so the next page preloads before the user reaches the bottom.

## [1.3.0] - 2026-04-25

WCA-style inspection mode + shareable multiplayer room links + UX polish.

### Added

- **Inspection mode** (Settings → Timer → Enable inspection) — optional WCA-style 15s countdown before each solve. Press spacebar to start inspection; the countdown ticks down in orange (`#ffa726`). While the countdown is running, press and hold spacebar (or a color key) to arm — the display turns green (`#4caf50`) to acknowledge, and the countdown keeps ticking. Release the key to start the actual timer from 0. Penalties are applied automatically on overrun: 0–2s past the limit → `+2` on the resulting solve, more than 2s → auto-DNF (the timer stops itself and records a DNF before the user can start). Press Escape during inspection to cancel back to idle. Duration is configurable from 5–60 seconds. Inspection is gated behind the new setting; default is OFF and existing behavior is unchanged.
- **Deep-link multiplayer rooms** — share `https://solvearena.net/room/<CODE>` and the recipient lands directly in the room when they already have a player name set (auto-joins on mount). First-time visitors get bounced to the home screen with the Compete popover already open, the room code prefilled, and the name field focused — type a name, press Enter, you're in. The popover's name-field Enter binding switches from "create room" to "join room" when a code is prefilled, since that's clearly the intent. Router state is consumed via `replace: true` so a refresh doesn't re-trigger the popover.
- **`inspectionEnabled` / `inspectionDuration` settings** persisted alongside the rest of `@M003:settings`. New `'inspecting'` `TimerPhase`. New `inspectionArmed` flag on `timerStore` so the press/release semantics work without exiting the inspecting phase (which would freeze the countdown).
- **Mobile parity for inspection** — touch handlers in `useTimerTouch` mirror the keyboard flow: tap on idle → start inspection; tap on inspecting → arm (green); release → run.

### Changed

- **Compete popover layout** — Join Room (the room-code field + outlined Join button) now sits above the `OR` divider. The prominent Create Room button sits below. Reflects the more common "I have a code" flow.
- **Timer area now reserves a fixed vertical footprint** — the AO5/AO12 row and the 4-slot previous-solves stack always render (with `visibility: hidden` placeholders when there are no solves yet), so the history bar below them lands at the same Y from the very first solve through the 50th. Previously the history bar slid downward as solves accumulated, which felt jittery mid-session. Applied to both solo and multiplayer.

### Fixed

- **Solo history table had a 36px gap above the column headers and the first body row was hidden behind the floating column header.** Both came from a stale `top: 36` on the sticky `<th>` cells — leftover from when the "HISTORY" bar lived inside the scroll container. After moving the bar outside the scroll container in v1.2.0, the offset was pushing the sticky headers down 36px from the top of the inner scroll area at scrollTop:0, leaving the body's first row visually covered. Removed the `top` override; sticky headers now sit at `top: 0` of the inner scroll container as MUI's `stickyHeader` intends.
- **Inspection second-press flow was stuck.** `endInspection()` recorded the penalty but didn't change `timerPhase`, so the subsequent `setReady()` / `setPreparing()` calls — which guard against transitions from non-`idle`/`stopped` phases — silently no-op'd. The countdown reset to 15 and the timer never started. `endInspection()` now exits the `inspecting` phase explicitly (to `idle` on in-time/`+2`, or to `stopped`+DNF on 2s+ overrun) and returns the DNF flag so the caller can short-circuit when needed.
- **Inspection on color keys was inconsistent.** Color keys could both start and end inspection, and the cross color was captured at the wrong moment. Now: only spacebar starts inspection (so all solves go through the same gate), but either spacebar or a color key can arm during inspection — and a color-key arm captures the cross color for the upcoming solve.

## [1.2.0] - 2026-04-25

Mobile-friendly multiplayer + cross-platform polish.

### Added

- **Mobile layout for multiplayer (room) screen** — same big-timer / scramble bottom sheet / peek-and-expand history drawer / full-screen running pattern as solo. Two multiplayer-specific differences: the desktop left sidebar (player info, competitor list, host controls, Leave) becomes a bottom sheet triggered by the burger menu; the history drawer wraps a card-based round list (see below) so the per-player columns scroll horizontally without breaking the timer.
- **Pill-card round history on mobile multiplayer** (`MobileResultsList`) — each completed round renders as a rounded card matching solo's `HistoryCard`. Inside the card, a `#N` round badge sits on the left and a horizontal stack of per-player mini-cells follows — each cell with a small uppercase player-name label on top and the time + controls below. For your own column, `+2` / `DNF` toggles and the cross-color picker render inline; for other players, just the time and a static color dot. Wide rooms scroll horizontally inside the drawer; long histories paginate at 50 rounds via `IntersectionObserver`. Fastest time per round still highlights in primary, matching the desktop table.
- **`vhSafe(n)` / `minVhSafe(n)` helpers** in `src/lib/utils/viewport.ts` — a tiny wrapper that emits `{ height: 'NNvh', '@supports (height: 100dvh)': { height: 'NNdvh' } }`. Modern browsers use the dynamic-viewport unit, older browsers fall back to `vh`.
- **Mobile sizing for room `SolveDetailModal`** — same pass we did for solo's modal: bigger time display, `medium` penalty buttons (`minWidth: 64`), bigger cross-color circles (28→36), `fullWidth` Copy button on mobile, side-margin honoring `env(safe-area-inset-top)`.

### Changed

- **`ScrambleActionSheet.onSetCustomScramble` is now optional** — multiplayer omits it because scrambles are server-controlled per round, so the "Edit scramble" row is hidden in the multiplayer action sheet. Manual time entry still works (and is gated on `!hasSubmittedCurrentRound` per the existing desktop flow).

### Fixed

- **Android URL bar pushed content offscreen on mobile.** Android Chrome's `100vh` equals the _largest_ possible viewport (URL bar hidden), so when the URL bar is visible the bottom of the layout sits below the visible window — most obvious on the solo history peek bar. Replaced fixed-`vh` values across all top-level layout containers and bottom drawers with `vhSafe()` / `minVhSafe()`. Touched `routes`, `SoloScreen`, `RoomScreen`, `LobbyScreen`, `HistoryDrawer`, `MobileResultsDrawer`, `RoomSidebarSheet`. iOS was already happy, no behavior change there.
- **History sticky header drifted with horizontal scroll on narrow viewports.** The desktop history container had `overflowY: 'auto'`, which CSS auto-promotes to `overflow: auto` on both axes when the table is wider than the viewport — so the sticky header (and the trash icon) shifted left along with the horizontal scroll, leaving the trash floating in the middle of the visible area. Restructured into a flex column with the header in its own non-scrolling row and the table in an inner scroll container. Applied to both desktop solo and desktop multiplayer; mobile layouts use a separate drawer and weren't affected.

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

[1.3.5]: https://github.com/Melkoh02/solve-arena/releases/tag/v1.3.5
[1.3.4]: https://github.com/Melkoh02/solve-arena/releases/tag/v1.3.4
[1.3.3]: https://github.com/Melkoh02/solve-arena/releases/tag/v1.3.3
[1.3.2]: https://github.com/Melkoh02/solve-arena/releases/tag/v1.3.2
[1.3.1]: https://github.com/Melkoh02/solve-arena/releases/tag/v1.3.1
[1.3.0]: https://github.com/Melkoh02/solve-arena/releases/tag/v1.3.0
[1.2.0]: https://github.com/Melkoh02/solve-arena/releases/tag/v1.2.0
[1.1.0]: https://github.com/Melkoh02/solve-arena/releases/tag/v1.1.0
[1.0.0]: https://github.com/Melkoh02/solve-arena/releases/tag/v1.0.0
