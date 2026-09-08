# Merge Points

The places where many flows converge. **Touch one of these and you've touched all the things listed under "Converges here" — including ones that don't appear obvious from grepping.** Built for the question "what else am I changing without realizing it?"

This is the first doc to read when planning a change to a load-bearing area. Each entry's "Touch radius" tells you what other flows or invariants you're putting at risk.

---

## How to Use This Doc

Each entry has:

- **File(s)** — where the merge point lives in the codebase.
- **Converges here** — the inputs, concerns, or responsibilities that meet at this point.
- **Invariants** — rules that must hold (defined in `glossary.md`; cross-referenced here).
- **Touch radius** — what _else_ breaks across the application if you change this carelessly.
- **Tested by** — the `flows.md` sections that exercise this point. Run them mentally or by manual QA after any modification.

---

## 1. Timer Engine & Touch Handler

**Files**:

- `src/components/timer/Timer.tsx` (component render + keyboard listeners)
- `useTimerTouch` hook inside `src/components/timer/Timer.tsx` (touch event handlers)

**Converges here**:

- Spacebar and color-key keyboard listener (`keydown` and `keyup` on `window`).
- Mobile touch gesture listener (`touchstart` and `touchend` via `useTimerTouch`).
- High-frequency animation loop (`requestAnimationFrame`) updating `displayTime` while `running`.
- WCA inspection countdown RAF loop and 2-second overrun automatic DNF timer.
- Dynamic color styling based on phase (red for `preparing`, green for `ready`, orange/red for `inspecting`).
- Spacebar hold requirement branching (`spacebarRequiresHold` setting).
- Color-key arming and post-stop cross-color assignment.
- Button-like element focus blur on Space press (preventing button activation on keyup).
- Escape key handling: resets `stopped` to `idle`, cancels inspection, or stops running timer as DNF.
- Running solve cancellation via `Backspace` or `Delete` (`timerStore.cancelRunning()`).
- Stop guard: ignores keypresses within 300ms of stopping to avoid accidental double-starts.
- Viewport and layout responsive font scaling (`large` prop scaling to `clamp(5.5rem, 28vw, 10rem)`).

**Invariants**:

1. **Button Defocus on Space**: Pressing Space while focus is on a `<button>` or element with `role="button"` (e.g. MUI `ButtonBase`) must immediately blur that element on `keydown`. Without this, the subsequent `keyup` triggers the button's `onClick` while simultaneously starting the timer.
2. **Interactive Element Exclusion**: Inputs, textareas, and selects (`INTERACTIVE_TAGS`) must block timer keys. Keystrokes inside open dialogs or popovers (`isInsideOverlay`) must also be ignored.
3. **Cancel Running Must Not Record**: Pressing `Backspace` or `Delete` while `running` must call `timerStore.cancelRunning()`, transitioning directly back to `idle`. It must **never** enter `stopped` (which would trigger the solve submission reactions in `SoloScreen` or `RoomScreen`).
4. **Inspection Mode Gate**: When `inspectionEnabled = true`, only Spacebar or first touch starts inspection. Color keys in `idle` are ignored until inspection begins, where they are used to arm the timer and stamp the cross color.
5. **Inspection Overrun Limits**: Overrun $\le 2\text{s}$ sets `inspectionPenalty = '+2'`; overrun $> 2\text{s}$ immediately stops the RAF loop and forces a DNF.
6. **Touch vs. Keyboard Symmetry**: Any state transition supported by keyboard must have an exact equivalent in `useTimerTouch`.

**Touch radius**:

- Every solo and multiplayer solve flows through this component.
- Breaking keyup/keydown handling disables timing entirely.
- Bypassing the button blur reintroduces race conditions where opening a dialog or drawer also triggers the timer.
- Modifying the RAF loop affects timer accuracy, battery consumption, and display fluidity.

**Tested by**: `flows.md` §2.1, §2.2, §2.3, §2.4, §2.5, §2.6, §2.7, §10.4.

---

## 2. Timer State Machine Store

**File**: `src/lib/stores/timerStore.ts`

**Converges here**:

- Core phase state machine: `'idle' | 'inspecting' | 'preparing' | 'ready' | 'running' | 'stopped'`.
- Memory of previous phase (`phaseBeforePreparing`) to restore state on early key releases.
- High-resolution wall-clock timestamping (`startTime = Date.now()`).
- Accumulated display time (`displayTime`) in milliseconds.
- Inspection countdown state (`inspectionStartTime`, `inspectionElapsedMs`, `inspectionArmed`, `inspectionPenalty`).
- DNF flags (`lastStopWasDnf`, `showDnf`).
- Abort handler (`cancelRunning()`).

**Invariants**:

1. **Disallowed Phase Jumps**: `startTimer()` can only transition from `'ready'`. `stopTimer()` can only transition from `'running'`.
2. **Accurate Elapsed Time**: When stopping, `displayTime` must be calculated as `Date.now() - startTime` before setting `startTime = null`.
3. **Inspection Armed Flag**: While in `'inspecting'`, holding Space or a color key sets `inspectionArmed = true`. The countdown must continue ticking during arming; release then calls `endInspection()` and starts the timer.
4. **DNF Overrun Transition**: Overrunning inspection by $> 2\text{s}$ transitions straight to `'stopped'` with `lastStopWasDnf = true` so existing solve-submission reactions automatically record the DNF.
5. **No Solve on Cancel**: `cancelRunning()` resets `startTime = null` and sets `timerPhase = 'idle'`.

**Touch radius**:

- Both `SoloScreen.tsx` and `RoomScreen.tsx` attach MobX `reaction()` handlers listening directly to `timerStore.timerPhase`.
- Any unexpected phase transition or change in phase naming breaks solve recording, room time submission, and socket event dispatch.

**Tested by**: `flows.md` §2.1, §2.4, §2.5, §6.2.

---

## 3. Solo Session Store

**File**: `src/lib/stores/soloStore.ts`

**Converges here**:

- Local solves array (`solves: SoloSolve[]`) persisted in `localStorage['soloSolves']`.
- Event filtering: `eventId` stored in `localStorage['soloEventId']`, isolating solves by event.
- Scramble generation: client-side `cubing/scramble` with fallback to server `/api/scramble/:eventId`.
- Per-session scramble navigation stack (`scrambleStack`, `scrambleStackIndex`, prev-floor).
- Mathematical statistics: `ao5`, `ao12`, `bestTime`, `globalAverage`, and `previousSolves`.
- Table row generation: `historyRows` with small 12-element sliding windows for rolling averages.
- Personal Best (PB) detection (`checkPb`) and notification queue (`pbNotification`).
- Penalty updates (`updatePenalty`), cross-color tagging (`updateCrossColor`), single solve deletion (`deleteSolve`), clear all event solves (`clearSolves`).
- Cross-mode synchronization: `syncFromRoom()` ingests solves completed in multiplayer into local storage.

**Invariants**:

1. **Scramble Stack Prev-Floor**: `scrambleStack[0]` must store the scramble of the most recently completed solve (`lastSolve?.scramble`). `canPrevScramble` allows stepping back at most one time to redo an accidental solve.
2. **Immutable Scramble Binding**: Solves bind to whatever scramble is active at start time.
3. **Event Isolation**: `clearSolves()` must only remove solves where `s.event === this.eventId`. Solves for other events must remain untouched.
4. **Room Ingestion Idempotency**: `syncFromRoom()` must check for existing solve by ID; if found, it updates penalty/crossColor; if missing, it appends with `online: true`.
5. **First Solve PB Suppression**: The first solve of a session establishes the baseline and must never trigger a PB notification banner.

**Touch radius**:

- Solo screen rendering, history table, mobile history cards, and statistics panels read directly from this store.
- Corrupting `saveToStorage()` or `loadFromStorage()` risks wiping the user's historical solve database.
- Modifying `syncFromRoom()` can duplicate multiplayer solves in local history.

**Tested by**: `flows.md` §2.1, §3.1, §3.3, §3.4, §4.1, §4.2, §4.4, §4.6.

---

## 4. Multiplayer Room Store & Socket Client

**File**: `src/lib/stores/roomStore.ts`

**Converges here**:

- Socket.IO client instance and lifecycle (auto-reconnect, connection timeouts).
- Authoritative room state mirror: `roomCode`, `hostId`, `eventId`, `currentScramble`, `currentRound`, `players`, `solves`.
- Competitor presence: active solvers (`solvingPlayerIds`), submitted count, remaining count.
- Optimistic submit tracking: `pendingSubmissionRound` to prevent duplicate submissions.
- Reconnection orchestrator: preserves `lastKnownPlayerId` and `pendingRejoinCode` on disconnect, emits `rejoin-room` on reconnect.
- PB notification queue (`pbNotificationQueue`) for room competitors, drained only when timer is idle.
- Outgoing socket actions: `createRoom`, `joinRoom`, `leaveRoom`, `emitTimerStart`, `submitTime`, `updatePenalty`, `updateCrossColor`, `changeEvent`, `kickPlayer`, `nextScramble`, `resetRoom`.

**Invariants**:

1. **Identity Preservation Across Sockets**: On reconnect, `lastKnownPlayerId` must be sent as `oldPlayerId` to transfer competitor identity and solve ownership to the new socket ID.
2. **Case Normalization**: `roomCode` must always be normalized to uppercase before socket emission.
3. **Duplicate Submission Guard**: `hasSubmittedCurrentRound` and `pendingSubmissionRound` must disable the timer and prevent duplicate `submit-time` emissions for the same round.
4. **Queue Draining Safety**: PB notification toasts must not appear while the user's timer is actively running (`timerPhase === 'running'`).
5. **Reconnection State Reset**: When a room is disbanded or reconnect fails completely, all room observables must reset to initial empty states.

**Touch radius**:

- Entire multiplayer screen (`RoomScreen`), competitor sidebar, results matrix, host controls, and server communication.
- Flaws in reconnection logic cause ghost players (3-player room with only 2 people) and stranded solves.

**Tested by**: `flows.md` §5.1, §5.2, §5.3, §6.1, §6.2, §6.3, §8.1, §8.2.

---

## 5. Authoritative Multiplayer Server

**File**: `server/index.ts`

**Converges here**:

- Express 5 HTTP server + Socket.IO 4 server configuration (CORS, ping intervals).
- In-memory room registry (`rooms = new Map<string, Room>()`).
- Unique 4-character room code generation (excluding confusing characters `I`, `O`, `0`, `1`).
- Scramble generation via `cubing/scramble` for room rounds and REST endpoint (`/api/scramble/:eventId`).
- Disconnection grace period manager (`disconnectTimers = new Map()`, `DISCONNECT_GRACE_MS = 30000`).
- Reconnection identity transfer and stale socket force-disconnection.
- Auto-advance barrier: evaluates whether all active connected players have submitted for the round.
- Host migration on host leave or grace expiration.
- Host-only moderation actions (`change-event`, `next-scramble`, `reset-room`, `kick-player`).

**Invariants**:

1. **Server Authority**: The server is the sole source of truth for scrambles, round numbers, and solve timestamps.
2. **Race-Condition-Proof Auto-Advance**: Auto-advance must verify `room.currentRound === roundAtSubmit` after the asynchronous scramble generation completes before advancing the round.
3. **Stale Socket Eviction**: On `rejoin-room`, if the abandoned socket ID is still connected in `io.sockets.sockets`, the server must call `stale.disconnect()` to prevent ghost duplicate entries.
4. **Immediate Leave vs. Grace Disconnect**: Explicit `leave-room` removes the player immediately and reassigns host if needed. Network `disconnect` marks `disconnected = true` and starts the 30-second grace timer.
5. **Empty Room Cleanup**: When `room.players.size === 0`, the room must be deleted from memory.

**Touch radius**:

- All real-time multiplayer functionality.
- Bugs here can cause desynchronized scrambles, deadlocked rounds that never advance, stuck ghost players, or server crashes on Render.

**Tested by**: `flows.md` §5.1, §6.2, §6.4, §7.1, §7.2, §7.3, §7.4, §8.1, §8.2.

---

## 6. Scramble Subsystem & Preview

**Files**:

- `src/components/timer/ScrambleDisplay.tsx` (desktop scramble container)
- `src/components/solo/mobile/MobileScramblePanel.tsx` (mobile scramble pill)
- `src/components/timer/ScramblePreview.tsx` (2D TwistyPlayer wrapper)
- `src/lib/hooks/useScramblePreviewShortcut.ts` (shared keyboard hook)

**Converges here**:

- Scramble text display and loading indicator.
- Custom scramble entry modal (desktop popover / mobile sheet).
- Manual time input popover with multi-format time parser (`parseTimeInput`).
- Dynamic import of `cubing/twisty` (`TwistyPlayer`) for 2D diagram preview.
- Keyboard shortcut hook for holding (`E`) or toggling (`Ctrl+E`) preview visibility.
- Prev/Next scramble navigation buttons (solo mode only).

**Invariants**:

1. **Preview Parity Across Layouts**: Both desktop `ScrambleDisplay` and mobile layouts use `useScramblePreviewShortcut` so keyboard shortcuts work consistently in both viewport modes.
2. **Manual Time Parser Limits**: Inputs must be clamped to `MAX_TIME_MS = 3_599_990` (59:59.99) and parsed according to standard speedcubing notation (centiseconds vs seconds vs mm:ss.xx).
3. **TwistyPlayer Cleanup**: Changing scrambles or unmounting must abort pending imports, remove existing DOM nodes, and call `player.jumpToEnd()` on render.
4. **Multiplayer Suppression**: Custom scrambles and prev/next buttons must be hidden in multiplayer rooms.

**Touch radius**:

- Scramble readability, manual solve entry, preview performance, and offline scramble display.

**Tested by**: `flows.md` §2.7, §3.2, §3.3, §3.4, §3.5.

---

## 7. Multiplayer Results Matrix

**Files**:

- `src/components/room/ResultsTable.tsx` (desktop multi-column table)
- `src/components/room/mobile/MobileResultsList.tsx` (mobile horizontal pill card list)
- `src/components/room/SolveDetailModal.tsx` (solve detail modal)

**Converges here**:

- Round-by-round competitor grid (newest round at top).
- Player column ordering: "You" is always pinned as the first column/cell.
- Fastest time per round highlight in `primary.main`.
- Interactive penalty toggles (`+2`, `DNF`) on own solves with immediate socket emission.
- Cross-color swatch and picker.
- Paginated infinite scroll (`PAGE_SIZE = 50`) using `IntersectionObserver`.
- Horizontal overflow handling for 3+ competitors (`width: max-content, minWidth: 100%`).
- Solve detail dialog displaying exact scramble, formatted time, and timestamp.

**Invariants**:

1. **"You" Pinned First**: Competitor sorting must always place the local player in position 0.
2. **Reactive Modal Data**: `SolveDetailModal` must read from live store solves so penalties modified from the table or modal update synchronously.
3. **Effective Time Comparison**: Best time per round must evaluate `getEffectiveTime(solve)` so penalties (`+2`, `DNF`) correctly affect winner highlighting.
4. **Infinite Scroll Sentinel**: Sentinel elements must use a non-zero height (8px) and `rootMargin: 300px` to prevent layout collapse in virtualized drawers.

**Touch radius**:

- Competitor standing visibility, penalty corrections during races, historical round review, mobile drawer layout integrity.

**Tested by**: `flows.md` §6.3, §6.5, §7.5.

---

## 8. Solo History & Analytics Engine

**Files**:

- `src/components/solo/SoloHistory.tsx` (desktop table)
- `src/components/solo/mobile/HistoryDrawer.tsx` (mobile slide-up drawer)
- `src/components/solo/mobile/HistoryCard.tsx` (mobile solve card)
- `src/components/solo/AverageDetailModal.tsx` (Ao5/Ao12 breakdown modal)

**Converges here**:

- Multi-column sortable table (`index`, `time`, `ao5`, `ao12`, `date`).
- Sticky table headers at `top: 0` inside an isolated scroll container.
- Infinite scrolling pagination (`PAGE_SIZE = 50`).
- Penalty toggle buttons (`+2`, `DNF`) with instant store and storage updates.
- Cross-color picker button.
- Single solve deletion with confirmation dialog.
- Clear all event solves with confirmation dialog.
- Average breakdown dialog: displays all solves contributing to an Ao5/Ao12, highlighting trimmed best (green) and trimmed worst (red), with copy-to-clipboard formatting.
- Mobile bottom drawer with compact peek bar (`HISTORY (n) · Best · Avg`).

**Invariants**:

1. **DNF Sort Order**: Sorting by time must treat `DNF` as `Infinity`, placing it at the very top (descending) or bottom (ascending).
2. **Sticky Header Isolation**: The table header must reside in its own non-scrolling flex row or have `top: 0` sticky positioning without horizontal drift.
3. **Trim Highlighting**: `AverageDetailModal` must accurately identify and color-code the 1 best and $maxDnf - 1$ worst solves that were excluded from the average.
4. **Delete Safety**: Delete buttons must prompt for confirmation before purging data.

**Touch radius**:

- User solve history, rolling average calculations, historical record integrity, mobile history browsing.

**Tested by**: `flows.md` §4.1, §4.2, §4.3, §4.4, §4.5, §4.6.

---

## 9. Theme Engine & Token Cascading

**Files**:

- `src/lib/stores/themeStore.ts`
- `src/themes/tokens.ts`
- `src/themes/glass.ts`, `src/themes/dark.ts`, `src/themes/light.ts`

**Converges here**:

- Scheme switching (`glass` $\rightarrow$ `light` $\rightarrow$ `dark`).
- Concrete color tokens (`ThemeTokens`).
- User palette customization (`setColor`, `resetPalette`).
- Debounced `localStorage` saving (250ms) under `@M003:user-palette`.
- Theme construction via dynamic factory functions.
- Glassmorphism styling (`backdropFilter: blur(...)`, translucent surfaces, diagonal gradient wallpaper).
- Dynamic accent color derivations using `alpha()`, `darken()`, and `lighten()`.

**Invariants**:

1. **Default Scheme**: First-time visitors must default to `glass`.
2. **Palette Isolation**: Overriding a token in `glass` must not alter tokens in `dark` or `light`.
3. **Cascading Accent Colors**: All translucent highlights, glowing text shadows, and border accents must be derived from `tokens.primary` via `alpha(tokens.primary, factor)` rather than hardcoded hex colors.
4. **Glass Paper Legibility**: Solid dark fallback colors must be provided for non-Paper elements so text remains readable even if backdrop filters are unsupported.

**Touch radius**:

- Visual styling, contrast, and theme consistency across every page, modal, drawer, and button in the application.

**Tested by**: `flows.md` §9.1, §9.2.

---

## 10. Settings Configuration Portal

**Files**:

- `src/components/settings/SettingsDialog.tsx`
- `src/lib/stores/settingsStore.ts`
- Sub-sections in `src/components/settings/` (`AppearanceSection`, `LayoutSection`, `TimerSection`, `DisplaySection`, `ShortcutsSection`)

**Converges here**:

- Layout mode selection (`auto`, `mobile`, `desktop`).
- Timer parameters: inspection toggle, inspection duration slider (5–60s), spacebar hold toggle, hold threshold slider (100–2000ms).
- Display options: timer precision (1 vs 2 decimals), time format ('auto' vs 'mm:ss.xx').
- Shortcut remapping table with conflict detection (`findConflicts`).
- Section-level reset buttons (`resetTimer`, `resetDisplay`, `resetLayout`, `resetShortcuts`).
- Immediate persistence to `localStorage['@M003:settings']`.

**Invariants**:

1. **Validation & Clamping**: Numeric thresholds must be clamped upon store ingestion (hold threshold: 100–2000ms; inspection duration: 5–60s).
2. **Conflict Highlighting**: Shortcuts sharing duplicate key combinations must display warning styling in the UI.
3. **Section Independence**: Resetting one section must not reset preferences in another.

**Touch radius**:

- Timer responsiveness, layout switches, keyboard shortcut bindings across the whole app.

**Tested by**: `flows.md` §9.3, §9.4, §9.5.

---

## 11. Lobby & Room Deep-Link Router

**Files**:

- `src/pages/LobbyScreen.tsx`
- `src/components/room/JoinRoomDialog.tsx` (Compete popover)
- `src/pages/RoomScreen.tsx` (route parameter parser and redirect guards)
- `src/routes/routes.tsx`

**Converges here**:

- Player name input and validation (`@M003:player-name`).
- 4-character room code entry and uppercase formatting.
- Socket room creation and joining actions.
- Deep-link route `/room/:code` parsing.
- Redirection of nameless visitors to `/` with `{ joinCode: code }` router state.
- Auto-opening of the Compete popover when arriving via deep link.
- Server health status indicator (`ServerStatusDot`).

**Invariants**:

1. **Name Requirement**: `createRoom` and `joinRoom` buttons must be disabled when `playerName.trim()` is empty.
2. **Clean Router State**: Deep-link join state must be consumed via `navigate(location.pathname, { replace: true, state: null })` to prevent re-opening the popover on subsequent page refreshes.
3. **Uppercase Normalization**: Room codes must automatically transform to uppercase on input and route navigation.

**Touch radius**:

- User onboarding, friend invites, room link sharing, direct URL navigation.

**Tested by**: `flows.md` §5.1, §5.2, §5.3, §5.4.
