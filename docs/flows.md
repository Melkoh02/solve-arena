# Flows

User-facing scenarios this application supports. Written for QA and for anyone trying to understand what Solve Arena _does_ without reading the code. Vocabulary like `effectiveTime`, `ao5`, `scrambleStack`, `inspectionArmed`, and `DISCONNECT_GRACE_MS` is defined in `glossary.md`.

> **How to read a flow**
> Each flow has: a **name**, a **trigger** (how the user gets there), the **happy path**, and **edge cases** worth probing. Where a flow merges with another, it's called out under "Touches".
>
> Code references are file paths only, no line numbers — line numbers rot. If a flow goes missing, fix it here in the next PR.

---

## Table of Contents

- [1. App Lifecycle & Bootstrapping](#1-app-lifecycle--bootstrapping)
  - [1.1 Cold Start & Store Hydration](#11-cold-start--store-hydration)
  - [1.2 Server Health Check & Wakeup Detection](#12-server-health-check--wakeup-detection)
- [2. Solo Timer Flows](#2-solo-timer-flows)
  - [2.1 Standard Spacebar Timing](#21-standard-spacebar-timing)
  - [2.2 Spacebar Requires Hold](#22-spacebar-requires-hold)
  - [2.3 Color Key Arming & Tagging](#23-color-key-arming--tagging)
  - [2.4 Inspection Countdown & Arming](#24-inspection-countdown--arming)
  - [2.5 Inspection Overrun Penalties (+2 and DNF)](#25-inspection-overrun-penalties-2-and-dnf)
  - [2.6 Running Solve Cancellation (Backspace/Delete)](#26-running-solve-cancellation-backspacedelete)
  - [2.7 Manual Time Entry](#27-manual-time-entry)
  - [2.8 Mobile Touch Timing](#28-mobile-touch-timing)
- [3. Scramble Generation & Navigation](#3-scramble-generation--navigation)
  - [3.1 Changing Puzzle Event](#31-changing-puzzle-event)
  - [3.2 2D Scramble Preview (Hold and Toggle)](#32-2d-scramble-preview-hold-and-toggle)
  - [3.3 Prev/Next Scramble Stack Navigation](#33-prevnext-scramble-stack-navigation)
  - [3.4 Custom Scramble Input](#34-custom-scramble-input)
  - [3.5 Offline Scramble Generation & Server Fallback](#35-offline-scramble-generation--server-fallback)
- [4. Solo Solve Management & Analytics](#4-solo-solve-management--analytics)
  - [4.1 Browsing & Sorting History](#41-browsing--sorting-history)
  - [4.2 Modifying Solve Penalties (+2 / DNF)](#42-modifying-solve-penalties-2--dnf)
  - [4.3 Assigning Cross Color](#43-assigning-cross-color)
  - [4.4 Deleting a Single Solve](#44-deleting-a-single-solve)
  - [4.5 Mobile 3-Finger Tap Solve Deletion](#45-mobile-3-finger-tap-solve-deletion)
  - [4.6 Clearing All Event Solves](#46-clearing-all-event-solves)
  - [4.7 Ao5 / Ao12 Breakdown Modal](#47-ao5--ao12-breakdown-modal)
  - [4.8 Personal Best (PB) Toast Notification](#48-personal-best-pb-toast-notification)
- [5. Multiplayer: Room Creation & Joining](#5-multiplayer-room-creation--joining)
  - [5.1 Creating a Room](#51-creating-a-room)
  - [5.2 Joining via 4-Character Code](#52-joining-via-4-character-code)
  - [5.3 Deep-Link Joining (`/room/:code`)](#53-deep-link-joining-roomcode)
  - [5.4 Sharing Room Invites (Native Share Sheet vs Clipboard)](#54-sharing-room-invites-native-share-sheet-vs-clipboard)
- [6. Multiplayer: Racing & Round Lifecycle](#6-multiplayer-racing--round-lifecycle)
  - [6.1 Synchronized Scramble & Preparation](#61-synchronized-scramble--preparation)
  - [6.2 Timer Start & Opponent Status Broadcasting](#62-timer-start--opponent-status-broadcasting)
  - [6.3 Submitting Solve & Optimistic State](#63-submitting-solve--optimistic-state)
  - [6.4 Auto-Advance Barrier & Round Progression](#64-auto-advance-barrier--round-progression)
  - [6.5 Background Tab Audio Alert on Round Start](#65-background-tab-audio-alert-on-round-start)
- [7. Multiplayer: Room Moderation & Host Controls](#7-multiplayer-room-moderation--host-controls)
  - [7.1 Host Changing Puzzle Event](#71-host-changing-puzzle-event)
  - [7.2 Host Skipping Scramble](#72-host-skipping-scramble)
  - [7.3 Host Resetting Room](#73-host-resetting-room)
  - [7.4 Host Kicking a Player](#74-host-kicking-a-player)
  - [7.5 Host Disconnection & Automatic Host Migration](#75-host-disconnection--automatic-host-migration)
- [8. Multiplayer: Connection & Reconnection Lifecycle](#8-multiplayer-connection--reconnection-lifecycle)
  - [8.1 Network Drop & 30-Second Grace Period](#81-network-drop--30-second-grace-period)
  - [8.2 Auto-Reconnection Handshake (`rejoin-room`)](#82-auto-reconnection-handshake-rejoin-room)
  - [8.3 Mobile Background Wakeup & Ghost Player Cleanup](#83-mobile-background-wakeup--ghost-player-cleanup)
  - [8.4 Voluntary Room Exit & Confirmation Modal](#84-voluntary-room-exit--confirmation-modal)
- [9. Settings & Customization](#9-settings--customization)
  - [9.1 Switching Visual Schemes (Dark, Light, Glass)](#91-switching-visual-schemes-dark-light-glass)
  - [9.2 Customizing Palette Color Tokens](#92-customizing-palette-color-tokens)
  - [9.3 Layout Mode Switching (Auto, Mobile, Desktop)](#93-layout-mode-switching-auto-mobile-desktop)
  - [9.4 Timer Precision & Time Format Configuration](#94-timer-precision--time-format-configuration)
  - [9.5 Rebinding Keyboard Shortcuts & Conflict Detection](#95-rebinding-keyboard-shortcuts--conflict-detection)
  - [9.6 Switching Language (English & Spanish)](#96-switching-language-english--spanish)
- [10. Mobile Layout Ergonomics & Gestures](#10-mobile-layout-ergonomics--gestures)
  - [10.1 Scramble Action Sheet](#101-scramble-action-sheet)
  - [10.2 History Bottom Drawer with Peek Bar](#102-history-bottom-drawer-with-peek-bar)
  - [10.3 Infinite Scroll Virtualization in Nested Drawers](#103-infinite-scroll-virtualization-in-nested-drawers)
  - [10.4 Mobile Room Sidebar Sheet](#104-mobile-room-sidebar-sheet)
- [11. Cross-Cutting Test Scenarios & QA Checklist](#11-cross-cutting-test-scenarios--qa-checklist)

---

## 1. App Lifecycle & Bootstrapping

### 1.1 Cold Start & Store Hydration

**Trigger**: User navigates to the application URL in a web browser.

**Happy Path**:

1. `src/main.tsx` instantiates the singleton `RootStore` (`src/lib/stores/rootStore.ts`).
2. `ThemeStore` loads saved scheme from `@M003:user-theme` (defaults to `'glass'` for first-time visitors) and palette token overrides from `@M003:user-palette`.
3. `SettingsStore` loads saved configuration from `@M003:settings` (or falls back to `SETTINGS_DEFAULTS`).
4. `SoloStore` loads solves array from `soloSolves` and last active event from `soloEventId` (defaults to `'333'`).
5. `LanguageStore` initializes `i18next` with language detected from `@M003:user-language` or browser navigator.
6. `SoloStore.generateScramble()` fires asynchronously, dynamically importing `cubing/scramble` to produce the initial random-state scramble.
7. `ThemeProvider` builds the dynamic theme and `CssBaseline` renders the glass wallpaper gradient.
8. App renders `SoloScreen` on route `/`.

**Touches**: `src/main.tsx`, `src/pages/App.tsx`, `src/lib/stores/rootStore.ts`, `src/themes/glass.ts`.

**Edge Cases**:

- LocalStorage corrupted or disabled $\rightarrow$ Stores catch `JSON.parse` errors silently and fall back to default empty state without crashing.
- Returning visitor with saved `'dark'` theme $\rightarrow$ Respected; user is not forced onto `'glass'`.

---

### 1.2 Server Health Check & Wakeup Detection

**Trigger**: App finishes mounting; `ServerStore` constructor runs automatically.

**Happy Path**:

1. `ServerStore.warmUp()` sets `status = 'waking'`.
2. Sends `GET ${SOCKET_URL}/api/health` with a 60-second timeout (allowing Render free-tier spinning instances to wake).
3. On HTTP 200 response, sets `status = 'online'` and initiates a 4-minute keep-alive ping interval.
4. `ServerStatusDot` in the top bar transitions from yellow (pulsing with elapsed seconds counter) to solid green.

**Touches**: `src/lib/stores/serverStore.ts`, `src/components/room/ServerStatusDot.tsx`.

**Edge Cases**:

- Server down or cold start takes longer than 60s $\rightarrow$ Sets `status = 'offline'` (red dot); subsequent user room action retries connection.

---

## 2. Solo Timer Flows

### 2.1 Standard Spacebar Timing

**Trigger**: User is on `SoloScreen` with `spacebarRequiresHold = false` (default).

**Happy Path**:

1. User presses and holds Spacebar.
2. `Timer.tsx` detects `e.code === 'Space'`. Because `spacebarRequiresHold` is false, it immediately calls `timerStore.setReady()`.
3. Timer display turns **green** (`#4caf50`) and resets display time to `0.00`.
4. User releases Spacebar (`keyup`).
5. `timerStore.startTimer()` sets `startTime = Date.now()` and enters `'running'`.
6. `requestAnimationFrame` loop increments `displayTime` and renders text with accent glow.
7. Cube is solved; user strikes any key (except modifier-only keys).
8. `timerStore.stopTimer()` freezes `displayTime` and transitions to `'stopped'`.
9. MobX `reaction` in `SoloScreen.tsx` notices `timerPhase === 'stopped'`, calls `soloStore.addSolve(displayTime, false, 'w')`, saves to `localStorage`, and triggers `generateScramble()`.

**Touches**: `src/components/timer/Timer.tsx`, `src/lib/stores/timerStore.ts`, `src/lib/stores/soloStore.ts`, `src/pages/SoloScreen.tsx`.

**Edge Cases**:

- Space pressed while focus is on an HTML button $\rightarrow$ `Timer.tsx` blurs the button immediately on `keydown`, so `keyup` fires safely on `document.body` instead of clicking the button.
- User taps Space rapidly within 300ms of stopping $\rightarrow$ Stop guard (`Date.now() - stopTimestamp.current < 300`) rejects the press to prevent accidental restarts.

---

### 2.2 Spacebar Requires Hold

**Trigger**: User enabled "Spacebar requires hold" in Settings $\rightarrow$ Timer (`spacebarRequiresHold = true`).

**Happy Path**:

1. User presses and holds Spacebar.
2. `timerStore.setPreparing()` is called; display turns **red** (`#f44336`).
3. Internal timeout starts for `colorKeyHoldThreshold` ms (default 500ms).
4. When threshold expires, `timerStore.setReady()` turns display **green** (`#4caf50`).
5. User releases Spacebar $\rightarrow$ Timer begins running.

**Touches**: `src/components/timer/Timer.tsx`, `src/lib/stores/settingsStore.ts`.

**Edge Cases**:

- User releases Spacebar _before_ threshold expires $\rightarrow$ `timerStore.cancelPreparing()` aborts back to `'idle'`; timer does not start.

---

### 2.3 Color Key Arming & Tagging

**Trigger**: User presses a configured cross color shortcut key (e.g. `W`, `Y`, `R`, `O`, `B`, `G`).

**Happy Path**:

1. **Pre-solve arming**: In `idle`, user presses and holds `Y` (Yellow). Display turns red, then green after threshold. `pendingColorRef` captures `'y'`.
2. Release `Y` starts the timer. When stopped, the solve is recorded with Yellow cross.
3. **Post-solve re-tagging**: User just finished a solve with default white cross, realized they solved on Blue, and taps `B`.
4. `handleColorStart('b')` immediately updates `soloStore.updateCrossColor(lastSolve.id, 'b')`.

**Touches**: `src/components/timer/Timer.tsx`, `src/lib/utils/shortcuts.ts`, `src/lib/constants/crossColors.ts`.

---

### 2.4 Inspection Countdown & Arming

**Trigger**: User enabled Inspection mode in Settings $\rightarrow$ Timer (`inspectionEnabled = true`, duration 15s).

**Happy Path**:

1. From `idle`, user presses Spacebar.
2. `timerStore.startInspection()` begins countdown from 15; RAF loop ticks. Display shows integer countdown in **orange** (`#ffa726`).
3. User inspects the cube for 8 seconds.
4. User presses and holds Spacebar (or a color key) to prepare to start.
5. `timerStore.armInspection()` sets `inspectionArmed = true`. Display turns **green** (`#4caf50`); countdown _continues ticking_.
6. User releases key before 15s $\rightarrow$ `endInspection(15)` records clean inspection (`inspectionPenalty = 'none'`), and timer starts running from 0.00.

**Touches**: `src/components/timer/Timer.tsx`, `src/lib/stores/timerStore.ts`.

**Edge Cases**:

- User presses Escape during inspection $\rightarrow$ `cancelInspection()` aborts countdown back to `idle` with zero penalties and no solve recorded.

---

### 2.5 Inspection Overrun Penalties (+2 and DNF)

**Trigger**: Inspection countdown exceeds the configured duration.

**Happy Path (+2 Overrun)**:

1. Inspection countdown passes 15s (remaining $< 0$).
2. Display turns **red** (`#f44336`) and shows `+1` (15.01–16.00s) then `+2` (16.01–17.00s).
3. User arms and starts timer at 16.5s.
4. `endInspection(15)` detects overrun $\le 2000\text{ ms}$, records `inspectionPenalty = '+2'`, and starts timer.
5. When solve finishes, `soloStore.updatePenalty(lastSolve.id, '+2')` applies the 2-second penalty.

**Happy Path (> 2s Overrun $\rightarrow$ DNF)**:

1. Inspection countdown reaches 17.01s (overrun $> 2000\text{ ms}$).
2. RAF loop executes `timerStore.forceDnfFromInspection()`.
3. Timer transitions directly to `'stopped'` with `lastStopWasDnf = true` and `displayTime = 0`.
4. `SoloScreen` reaction saves a DNF solve immediately; timer locks in stopped state until reset.

**Touches**: `src/components/timer/Timer.tsx`, `src/lib/stores/timerStore.ts`, `src/pages/SoloScreen.tsx`.

---

### 2.6 Running Solve Cancellation (Backspace/Delete)

**Trigger**: User messes up during a solve and wants to discard it without polluting statistics.

**Happy Path**:

1. Timer is currently in `'running'` phase.
2. User presses `Backspace` or `Delete`.
3. `Timer.tsx` intercepts the event, calls `timerStore.cancelRunning()`.
4. Timer phase returns directly to `'idle'`, `startTime` is wiped to `null`, `displayTime = 0`.
5. No reaction fires, no solve is appended, session statistics remain completely unchanged.

**Touches**: `src/components/timer/Timer.tsx`, `src/lib/stores/timerStore.ts`.

---

### 2.7 Manual Time Entry

**Trigger**: User clicks the keyboard icon on `ScrambleDisplay` (or taps "Manual Entry" in mobile `ScrambleActionSheet`).

**Happy Path**:

1. Popover opens with time text field.
2. User types raw centiseconds (e.g. `1425`), seconds (e.g. `14.25`), or minutes (e.g. `1:14.25`).
3. Parsed preview updates dynamically (`14.25s`).
4. User clicks Save or presses Enter.
5. `soloStore.addManualSolve(14250)` creates a solve with current scramble, date, and `time = 14250`.
6. Popover closes, fresh scramble generates.

**Touches**: `src/components/timer/ScrambleDisplay.tsx`, `src/lib/stores/soloStore.ts`.

**Edge Cases**:

- User enters time $> 59:59.99$ $\rightarrow$ Input validator rejects value, Save button remains disabled.

---

### 2.8 Mobile Touch Timing

**Trigger**: User operates the timer on a mobile phone or touch tablet via `useTimerTouch`.

**Happy Path**:

1. User touches and holds anywhere inside the large timer area.
2. `onTouchStart` initiates arming (or starts inspection if enabled).
3. When ready (green), user lifts finger.
4. `onTouchEnd` fires `startTimer()`.
5. When solve is complete, user taps anywhere on the screen with one finger.
6. `onTouchStart` detects `running` phase, calls `stopTimer()`.

**Touches**: `useTimerTouch` in `src/components/timer/Timer.tsx`.

---

## 3. Scramble Generation & Navigation

### 3.1 Changing Puzzle Event

**Trigger**: User selects a new puzzle from `PuzzleSelector` dropdown.

**Happy Path**:

1. User switches from 3x3x3 (`333`) to Pyraminx (`pyram`).
2. `soloStore.changeEvent('pyram')` updates `eventId` and saves to `localStorage['soloEventId']`.
3. History table immediately filters to show only Pyraminx solves.
4. `soloStore.generateScramble()` calls `randomScrambleForEvent('pyram')` and populates `currentScramble`.

**Touches**: `src/components/timer/PuzzleSelector.tsx`, `src/lib/stores/soloStore.ts`.

---

### 3.2 2D Scramble Preview (Hold and Toggle)

**Trigger**: User wants to verify their physical cube state matches the generated scramble.

**Happy Path (Hold)**:

1. User presses and holds `E` (`holdScramblePreview`).
2. `useScramblePreviewShortcut` sets `showPreview = true`.
3. `ScramblePreview.tsx` renders 2D SVG unfold of the puzzle via `TwistyPlayer`.
4. User releases `E` $\rightarrow$ preview disappears immediately.

**Happy Path (Toggle)**:

1. User presses `Ctrl+E` (`toggleScramblePreview`).
2. Preview toggles permanently on and saves `'true'` to `localStorage['scramblePreviewVisible']`.
3. Subsequent scrambles render preview automatically until toggled off.

**Touches**: `src/lib/hooks/useScramblePreviewShortcut.ts`, `src/components/timer/ScramblePreview.tsx`.

---

### 3.3 Prev/Next Scramble Stack Navigation

**Trigger**: User clicks Chevron Left (Prev) or Chevron Right (Next) on the scramble bar.

**Happy Path (Redo Accident)**:

1. User accidentally taps Spacebar, stopping the timer at 0.12s.
2. User deletes the 0.12s solve.
3. User clicks **Previous Scramble** (`<`).
4. `soloStore.prevScramble()` decrements `scrambleStackIndex` to index 0 (the prev-floor), restoring the exact scramble from the accidental solve.
5. User performs the solve on the intended scramble.

**Happy Path (Roll Next)**:

1. User doesn't like the scramble, clicks **Next Scramble** (`>`).
2. `soloStore.nextScramble()` generates and appends a fresh scramble to `scrambleStack`.

**Touches**: `src/lib/stores/soloStore.ts`, `src/components/timer/ScrambleDisplay.tsx`, `src/components/solo/mobile/MobileScramblePanel.tsx`.

---

### 3.4 Custom Scramble Input

**Trigger**: User clicks the Edit (Pencil) icon on the scramble bar.

**Happy Path**:

1. Dialog opens; user pastes a scramble algorithm (e.g. `R U R' U'`).
2. User clicks Apply.
3. `soloStore.setCustomScramble(...)` sets `isCustomScramble = true`. Prev/next navigation buttons are hidden/disabled.
4. User solves; upon completion, `isCustomScramble` automatically resets to `false` and generates a normal random scramble.

**Touches**: `src/components/timer/ScrambleDisplay.tsx`, `src/lib/stores/soloStore.ts`.

---

### 3.5 Offline Scramble Generation & Server Fallback

**Trigger**: User is on an airplane or disconnected network.

**Happy Path**:

1. App calls `generateScramble()`.
2. Dynamic `import('cubing/scramble')` loads from browser cache and computes the random state in WebAssembly/JS.
3. Scramble appears without network access.

**Fallback Path**:

1. If client import fails, Axios calls `GET ${SOCKET_URL}/api/scramble/:eventId`.
2. Server returns JSON `{ scramble: "..." }`.

**Touches**: `src/lib/stores/soloStore.ts`, `server/index.ts`.

---

## 4. Solo Solve Management & Analytics

### 4.1 Browsing & Sorting History

**Trigger**: User inspects the history table on `SoloScreen` or expands the mobile `HistoryDrawer`.

**Happy Path**:

1. History table lists all solves for the active event (newest-first by default).
2. User clicks column header "Time".
3. Table re-sorts ascending (fastest first); clicking again sorts descending.
4. Scrolling down past 50 rows triggers `IntersectionObserver` sentinel, loading the next batch of 50.

**Touches**: `src/components/solo/SoloHistory.tsx`, `src/components/solo/mobile/HistoryDrawer.tsx`.

---

### 4.2 Modifying Solve Penalties (+2 / DNF)

**Trigger**: User realizes a finished solve had a misaligned face or was unsolved.

**Happy Path**:

1. User locates the solve in the history table or card.
2. User clicks `+2` button.
3. `soloStore.updatePenalty(solve.id, '+2')` recomputes `effectiveTime` (+2000ms), updates rolling `ao5`/`ao12`, and saves to `localStorage`.
4. Re-clicking `+2` toggles penalty back to `'none'`. Clicking `DNF` sets effective time to $\infty$.

**Touches**: `src/lib/stores/soloStore.ts`, `src/lib/utils/averages.ts`.

---

### 4.3 Assigning Cross Color

**Trigger**: User taps the color circle icon next to a solve in the history.

**Happy Path**:

1. Popover opens showing 6 WCA face color swatches (White, Yellow, Red, Orange, Blue, Green).
2. User selects Orange.
3. `soloStore.updateCrossColor(solve.id, 'o')` saves change; history row displays orange swatch.

**Touches**: `src/components/room/CrossColorPicker.tsx`, `src/lib/stores/soloStore.ts`.

---

### 4.4 Deleting a Single Solve

**Trigger**: User clicks the trash can icon on a specific solve row.

**Happy Path**:

1. Confirmation modal appears ("Delete Solve #N?").
2. User confirms deletion.
3. `soloStore.deleteSolve(id)` filters out the solve and updates `localStorage`.
4. All rolling averages (Ao5, Ao12, session mean, best time) recalculate immediately.

**Touches**: `src/components/solo/SoloHistory.tsx`, `src/lib/stores/soloStore.ts`.

---

### 4.5 Mobile 3-Finger Tap Solve Deletion

**Trigger**: User on mobile layout finishes a bad solve and wants to delete it immediately without opening the history drawer.

**Happy Path**:

1. With timer in `idle` or `stopped`, user taps the screen with 3 fingers simultaneously.
2. `MobileSoloLayout.tsx` intercepts `e.touches.length >= 3`, cancels any arming state, and opens the delete confirmation dialog for `soloStore.lastSolve`.
3. User taps Confirm; solve is deleted.

**Touches**: `src/components/solo/mobile/MobileSoloLayout.tsx`.

---

### 4.6 Clearing All Event Solves

**Trigger**: User clicks the main trash can icon in the history header (or presses `Ctrl+Shift+Backspace`).

**Happy Path**:

1. Modal warns: "Clear all N solves for 3x3x3? This cannot be undone."
2. User clicks Confirm.
3. `soloStore.clearSolves()` deletes all solves where `s.event === eventId`. Solves for other puzzle events are preserved.

**Touches**: `src/components/solo/SoloHistory.tsx`, `src/lib/stores/soloStore.ts`.

---

### 4.7 Ao5 / Ao12 Breakdown Modal

**Trigger**: User clicks an Ao5 or Ao12 value in the history table or stats header.

**Happy Path**:

1. `AverageDetailModal` opens showing all 5 or 12 solves in the window.
2. Trimmed fastest solve is highlighted in **green**; trimmed slowest solve(s) in **red**.
3. Middle averaged solves are shown in standard text.
4. User clicks "Copy", copying the formatted WCA-style text breakdown to the clipboard.

**Touches**: `src/components/solo/AverageDetailModal.tsx`.

---

### 4.8 Personal Best (PB) Toast Notification

**Trigger**: User completes a solve with an effective time faster than any previous solve in the current session.

**Happy Path**:

1. Solve completes and satisfies `effTime < prevBest`.
2. `SoloStore` sets `pbNotification = "9.42"`.
3. Bottom Snackbar appears with trophy icon: "New Personal Best! 9.42".
4. Toast auto-dismisses after 4 seconds (elevated by 80px on mobile to avoid covering drawers).

**Touches**: `src/lib/stores/soloStore.ts`, `src/pages/SoloScreen.tsx`.

---

## 5. Multiplayer: Room Creation & Joining

### 5.1 Creating a Room

**Trigger**: User clicks "Compete" button in top bar, selects "Create Room".

**Happy Path**:

1. Compete popover opens; user types display name (if not already saved in `@M003:player-name`).
2. User clicks "Create Room".
3. `roomStore.createRoom()` establishes Socket.IO connection and emits `create-room` { playerName }.
4. Server generates 4-character code (e.g. `ABCD`), initializes room state, sets user as host.
5. Client receives `{ roomCode: 'ABCD' }`, navigates to `/room/ABCD`.
6. `RoomScreen` mounts, displaying room code, host controls, and competitor list.

**Touches**: `src/components/room/JoinRoomDialog.tsx`, `src/lib/stores/roomStore.ts`, `server/index.ts`, `src/pages/RoomScreen.tsx`.

---

### 5.2 Joining via 4-Character Code

**Trigger**: Friend provides a 4-character code.

**Happy Path**:

1. User opens Compete popover, enters room code (e.g. `abcd`).
2. Input automatically transforms to uppercase `ABCD`.
3. User clicks "Join Room".
4. `roomStore.joinRoom('ABCD')` emits `join-room`.
5. Server joins socket to room `ABCD`, returns `{ success: true }`.
6. Client navigates to `/room/ABCD`.

**Touches**: `src/components/room/JoinRoomDialog.tsx`, `src/lib/stores/roomStore.ts`, `server/index.ts`.

---

### 5.3 Deep-Link Joining (`/room/:code`)

**Trigger**: Friend sends link `https://solvearena.net/room/ABCD`.

**Happy Path (Existing Player)**:

1. User clicks link. `RoomScreen` mounts with `urlCode = 'ABCD'`.
2. `roomStore.playerName` exists in `localStorage`.
3. Client immediately calls `roomStore.joinRoom('ABCD')` and connects directly.

**Happy Path (First-Time Visitor)**:

1. User clicks link; no player name exists in storage.
2. `RoomScreen` redirects to `/` with router state `{ joinCode: 'ABCD' }`.
3. `SoloScreen` auto-opens Compete popover with room code prefilled and name input focused.
4. User types name and hits Enter $\rightarrow$ joins room `ABCD`.

**Touches**: `src/pages/RoomScreen.tsx`, `src/pages/SoloScreen.tsx`, `src/components/room/JoinRoomDialog.tsx`.

---

### 5.4 Sharing Room Invites (Native Share Sheet vs Clipboard)

**Trigger**: Competitor clicks the Share icon next to the room code.

**Happy Path (Mobile / Web Share Supported)**:

1. User taps Share icon.
2. App invokes `navigator.share({ title, text })` where `text` contains the templated invite: `"{name} invited you to a Solve Arena, join here: {url}"`.
3. Native OS share sheet opens (Messages, WhatsApp, AirDrop).

**Happy Path (Desktop Fallback)**:

1. Browser does not support `navigator.share`.
2. App writes templated invite text to `navigator.clipboard.writeText(...)`.
3. Toast confirms "Invite link copied to clipboard!".

**Touches**: `src/pages/RoomScreen.tsx`, `src/components/room/mobile/MobileRoomTopBar.tsx`.

---

## 6. Multiplayer: Racing & Round Lifecycle

### 6.1 Synchronized Scramble & Preparation

**Trigger**: Competitors enter a room or a new round begins.

**Happy Path**:

1. Server broadcasts `room-state` containing `currentScramble` and `currentRound`.
2. All connected clients display identical scramble text and 2D preview.
3. Competitors scramble their physical cubes.

**Touches**: `server/index.ts`, `src/lib/stores/roomStore.ts`, `src/pages/RoomScreen.tsx`.

---

### 6.2 Timer Start & Opponent Status Broadcasting

**Trigger**: Competitor begins their solve.

**Happy Path**:

1. Competitor releases Spacebar; timer phase transitions to `'running'`.
2. Reaction in `RoomScreen.tsx` detects `running` phase, calls `roomStore.emitTimerStart()`.
3. Socket emits `timer-start`.
4. Server broadcasts `player-solving` { playerId } to all other room members.
5. Opponents' sidebars immediately display "Solving..." status with animated pulse icon next to that competitor.

**Touches**: `src/pages/RoomScreen.tsx`, `src/lib/stores/roomStore.ts`, `server/index.ts`, `src/components/room/PlayerSidebar.tsx`.

---

### 6.3 Submitting Solve & Optimistic State

**Trigger**: Competitor stops timer.

**Happy Path**:

1. Timer enters `'stopped'` phase.
2. `roomStore.submitTime(displayTime, isDnf)` sets `pendingSubmissionRound = currentRound` (disabling timer to prevent double-timing).
3. Client emits `submit-time` { time, dnf }.
4. Server records solve in `room.solves` and broadcasts updated `room-state`.
5. Local client clears `pendingSubmissionRound`; sidebar reflects "Finished" with final time.
6. Reaction syncs solve into local `soloStore` via `syncFromRoom()` so multiplayer solves persist permanently in the user's browser history.

**Touches**: `src/pages/RoomScreen.tsx`, `src/lib/stores/roomStore.ts`, `src/lib/stores/soloStore.ts`, `server/index.ts`.

---

### 6.4 Auto-Advance Barrier & Round Progression

**Trigger**: The final solving competitor in the room finishes their solve.

**Happy Path**:

1. Server receives the last remaining competitor's `submit-time`.
2. Evaluates `submittedCount >= connectedPlayers.length` $\rightarrow$ True.
3. Server asynchronously generates next scramble for `room.eventId`.
4. Increments `room.currentRound += 1` and updates `room.currentScramble`.
5. Server broadcasts updated `room-state`.
6. All clients reset their timer to `0.00` in `idle` state, displaying the fresh scramble for the next round.
7. Results table appends the completed round to the top of the history list.

**Touches**: `server/index.ts`, `src/lib/stores/roomStore.ts`, `src/pages/RoomScreen.tsx`.

---

### 6.5 Background Tab Audio Alert on Round Start

**Trigger**: A new round auto-advances while a competitor has Solve Arena backgrounded or minimized.

**Happy Path**:

1. `RoomScreen` reaction detects `roomStore.currentRound` incremented.
2. Evaluates `document.hidden === true`.
3. Synthesizes an 880 Hz sine-wave beep via Web Audio API (`AudioContext`).
4. Competitor hears the tone, switches back to the tab, and scrambles for the new round.

**Touches**: `src/pages/RoomScreen.tsx`.

---

## 7. Multiplayer: Room Moderation & Host Controls

### 7.1 Host Changing Puzzle Event

**Trigger**: Host selects a new puzzle from `HostControls` (e.g. 4x4x4).

**Happy Path**:

1. Host selects `444` in `HostControls` dropdown.
2. Client emits `change-event` { eventId: '444' }.
3. Server updates `room.eventId`, generates 4x4x4 scramble, increments `room.currentRound`, and broadcasts `room-state`.
4. All competitors' screens immediately switch to 4x4x4 scramble.

**Touches**: `src/components/room/HostControls.tsx`, `server/index.ts`.

---

### 7.2 Host Skipping Scramble

**Trigger**: Scramble is bad or a competitor popped a piece during scramble; host clicks "Next Scramble".

**Happy Path**:

1. Host clicks "Next Scramble".
2. Client emits `next-scramble`.
3. Server generates fresh scramble, increments `currentRound`, and broadcasts state.
4. Unfinished solves for the skipped round are safely bypassed.

**Touches**: `src/components/room/HostControls.tsx`, `server/index.ts`.

---

### 7.3 Host Resetting Room

**Trigger**: Session is complete; host wants to restart clean at Round 1.

**Happy Path**:

1. Host clicks "Reset Room".
2. Client emits `reset-room`.
3. Server clears `room.solves = []`, resets `currentRound = 1`, generates fresh scramble, and broadcasts.
4. Results table clears for all competitors. (Solves previously synced to competitors' `soloStore` remain safely in local history).

**Touches**: `src/components/room/HostControls.tsx`, `server/index.ts`.

---

### 7.4 Host Kicking a Player

**Trigger**: A competitor is AFK, disruptive, or blocking round progression.

**Happy Path**:

1. Host clicks Kick icon next to player's name in `PlayerList`.
2. Client emits `kick-player` { playerId }.
3. Server removes player from `room.players` and sends `kicked` socket event directly to that socket.
4. Kicked client disconnects socket, displays error toast ("You have been removed from the room"), and navigates back to `/`.
5. Remaining players continue racing uninterrupted.

**Touches**: `src/components/room/PlayerList.tsx`, `server/index.ts`, `src/lib/stores/roomStore.ts`.

---

### 7.5 Host Disconnection & Automatic Host Migration

**Trigger**: Room host closes their browser or loses network connection.

**Happy Path**:

1. Host socket disconnects. Server marks host `disconnected = true` and starts 30s grace timer.
2. If host does not reconnect within 30 seconds:
3. Server removes old host and finds the next connected competitor (`!p.disconnected`).
4. Server assigns `nextHost.isHost = true`, updates `room.hostId = nextHost.id`, and broadcasts `room-state`.
5. New host's UI immediately mounts `HostControls` (puzzle selector, skip, reset).

**Touches**: `server/index.ts`, `src/components/room/PlayerSidebar.tsx`, `src/components/room/HostControls.tsx`.

---

## 8. Multiplayer: Connection & Reconnection Lifecycle

### 8.1 Network Drop & 30-Second Grace Period

**Trigger**: User's Wi-Fi briefly blips or cell tower switches while in a multiplayer arena.

**Happy Path**:

1. Client socket disconnects. `roomStore.isConnected` becomes `false`.
2. `roomStore` preserves `pendingRejoinCode = roomCode` and `lastKnownPlayerId = socket.id`.
3. Top bar displays red banner: "Reconnecting...".
4. Server flags player as `disconnected = true` and starts `DISCONNECT_GRACE_MS` (30s) timer.
5. Opponents see "(Disconnected)" next to player; round auto-advance does not stall waiting for them.

**Touches**: `src/lib/stores/roomStore.ts`, `server/index.ts`, `src/pages/RoomScreen.tsx`.

---

### 8.2 Auto-Reconnection Handshake (`rejoin-room`)

**Trigger**: Network connectivity returns within 30 seconds.

**Happy Path**:

1. Socket.IO client successfully reconnects, assigning a new `socket.id`.
2. `connect` listener in `roomStore` detects `pendingRejoinCode` and `lastKnownPlayerId`.
3. Client emits `rejoin-room` { roomCode, playerName, oldPlayerId: lastKnownPlayerId }.
4. Server clears 30-second disconnect timer.
5. Server transfers old competitor profile and historical solves onto the new `socket.id`.
6. Server broadcasts fresh `room-state`.
7. Client clears "Reconnecting..." banner; player is fully restored with their previous round record intact.

**Touches**: `src/lib/stores/roomStore.ts`, `server/index.ts`.

---

### 8.3 Mobile Background Wakeup & Ghost Player Cleanup

**Trigger**: Mobile user locks phone, then unlocks 45 seconds later.

**Happy Path**:

1. Browser wakes; new socket connects and emits `rejoin-room` before the server's ping timeout has closed the old dead socket.
2. Server detects `oldPlayer` still in room.
3. Server transfers identity to new socket ID, updates solve bindings, and explicitly calls `stale.disconnect()` on the old socket.
4. This prevents the "3-player ghost in a 2-player room" bug where an abandoned socket would otherwise linger.

**Touches**: `server/index.ts`.

---

### 8.4 Voluntary Room Exit & Confirmation Modal

**Trigger**: Competitor clicks "Leave" button or presses hardware Back button on mobile.

**Happy Path**:

1. Leave Confirmation dialog opens: "Leave room? You'll lose your spot in this arena."
2. User clicks Confirm.
3. Client emits `leave-room`, disconnects socket, resets `roomStore` observables, and navigates to `/`.
4. Server immediately removes competitor and broadcasts updated state to remaining players.

**Touches**: `src/pages/RoomScreen.tsx`, `src/lib/stores/roomStore.ts`, `server/index.ts`.

---

## 9. Settings & Customization

### 9.1 Switching Visual Schemes (Dark, Light, Glass)

**Trigger**: User clicks theme toggle icon in top bar or selects a scheme in Settings $\rightarrow$ Appearance.

**Happy Path**:

1. User clicks scheme selector (`light`, `dark`, or `glass`).
2. `themeStore.setScheme(scheme)` updates observable and writes to `@M003:user-theme`.
3. `themeStore.theme` constructs new theme instance; MUI `ThemeProvider` immediately re-skins all UI elements.

**Touches**: `src/lib/stores/themeStore.ts`, `src/components/settings/AppearanceSection.tsx`, `src/themes/`.

---

### 9.2 Customizing Palette Color Tokens

**Trigger**: User clicks color swatch picker in Settings $\rightarrow$ Appearance.

**Happy Path**:

1. User selects a custom primary color (e.g. Neon Cyan `#00E5FF`).
2. `themeStore.setColor(scheme, 'primary', '#00E5FF')` updates palette overrides.
3. UI immediately updates button borders, active chips, and glow effects.
4. Overrides are debounced and saved to `localStorage['@M003:user-palette']` after 250ms.

**Touches**: `src/lib/stores/themeStore.ts`, `src/themes/tokens.ts`.

---

### 9.3 Layout Mode Switching (Auto, Mobile, Desktop)

**Trigger**: User changes layout preference in Settings $\rightarrow$ Layout.

**Happy Path**:

1. User selects "Mobile" on a widescreen desktop monitor.
2. `settingsStore.setLayoutMode('mobile')` persists to `@M003:settings`.
3. `useIsMobile()` returns `true` regardless of window width.
4. Desktop layout unmounts; mobile layout mounts with large timer, bottom sheets, and touch-optimized controls.

**Touches**: `src/lib/hooks/useIsMobile.ts`, `src/lib/stores/settingsStore.ts`.

---

### 9.4 Timer Precision & Time Format Configuration

**Trigger**: User toggles precision (0.01 vs 0.1) or format ('auto' vs 'mm:ss.xx') in Settings $\rightarrow$ Display.

**Happy Path**:

1. User selects `1` decimal precision.
2. Timer and history table immediately re-render times truncated to single tenths (e.g. `9.4` instead of `9.42`).
3. Raw millisecond times in storage remain unchanged and uncorrupted.

**Touches**: `src/components/settings/DisplaySection.tsx`, `src/lib/utils/formatTime.ts`.

---

### 9.5 Rebinding Keyboard Shortcuts & Conflict Detection

**Trigger**: User clicks a shortcut row in Settings $\rightarrow$ Shortcuts and strikes new keys.

**Happy Path**:

1. User clicks "Toggle History" (default `H`), and presses `Ctrl+H`.
2. Dialog listens to `keydown`, captures `{ key: 'h', ctrl: true }`.
3. `settingsStore.setShortcut('toggleHistory', ...)` saves new binding.
4. If another action already uses `Ctrl+H`, `findConflicts()` renders a yellow warning indicator on both conflicting rows.

**Touches**: `src/components/settings/ShortcutsSection.tsx`, `src/lib/utils/shortcuts.ts`.

---

### 9.6 Switching Language (English & Spanish)

**Trigger**: User selects Spanish in the Language dropdown.

**Happy Path**:

1. User selects "Español".
2. `languageStore.setLanguage('es')` calls `i18n.changeLanguage('es')` and persists to `@M003:user-language`.
3. All translated text re-renders in Spanish across all views, dialogs, and toasts.

**Touches**: `src/lib/stores/languageStore.ts`, `src/localization/index.ts`, `src/localization/locales/`.

---

## 10. Mobile Layout Ergonomics & Gestures

### 10.1 Scramble Action Sheet

**Trigger**: User taps anywhere on the compact scramble pill on mobile.

**Happy Path**:

1. Bottom action sheet slides up smoothly.
2. Presents 3 large thumb-friendly options: "3D Preview", "Edit Scramble", "Manual Time Entry".
3. Tapping an action triggers the modal/preview and dismisses the sheet.

**Touches**: `src/components/solo/mobile/ScrambleActionSheet.tsx`.

---

### 10.2 History Bottom Drawer with Peek Bar

**Trigger**: User views the bottom of the screen on mobile layout.

**Happy Path**:

1. Bottom peek bar shows `HISTORY (n) · Best · Avg`.
2. User taps or drags the peek bar upward.
3. Bottom drawer expands to 85% of dynamic viewport height (`minVhSafe(85)`).
4. Solves render as card items with index, time, date, penalty toggles, and cross color.
5. Close button (X) is pinned in top-right; clear-all trash is isolated in top-left to avoid misclicks.

**Touches**: `src/components/solo/mobile/HistoryDrawer.tsx`, `src/components/solo/mobile/HistoryCard.tsx`.

---

### 10.3 Infinite Scroll Virtualization in Nested Drawers

**Trigger**: User scrolls down a long history inside the mobile bottom drawer.

**Happy Path**:

1. `HistoryDrawer` sets up an `IntersectionObserver` with `root: scrollEl` and `rootMargin: '300px'`.
2. User scrolls past solve #40.
3. The 8px sentinel triggers before reaching the bottom, appending the next 50 solves without layout jumps or scroll chaining.

**Touches**: `src/components/solo/mobile/HistoryDrawer.tsx`, `src/components/room/mobile/MobileResultsList.tsx`.

---

### 10.4 Mobile Room Sidebar Sheet

**Trigger**: Competitor taps burger menu in top bar of mobile multiplayer room.

**Happy Path**:

1. `RoomSidebarSheet` slides up from bottom.
2. Displays room code, share button, host controls (if host), competitor cards with live status indicators, win counts, and current/last/best stats.
3. Prominent full-width "Leave Room" button is anchored at the bottom.

**Touches**: `src/components/room/mobile/RoomSidebarSheet.tsx`.

---

## 11. Cross-Cutting Test Scenarios & QA Checklist

After making changes to core files, verify these multi-system scenarios:

1. **Spacebar Defocus Test**: Focus an action button with Tab or click, then hold Space to start timing. Verify the button does _not_ click or open its modal when Space is released.
2. **Hard Refresh in Multiplayer**: Enter a multiplayer room, start a solve, refresh the browser mid-session. Verify you rejoin the room with the same name, historical solves remain bound to you, and no ghost player is left behind.
3. **Multi-Event Data Isolation**: Do 3 solves on 3x3x3, switch to Pyraminx, do 2 solves, click "Clear All Solves" on Pyraminx. Switch back to 3x3x3; verify all 3x3x3 solves and rolling statistics remain intact.
4. **Extreme Overrun Inspection**: Start inspection, let countdown expire past 15s into overrun. Verify +1 and +2 markers appear in red, and passing 17s forces an immediate DNF solve record without freezing the timer.
5. **Trimmed Average DNF Verification**:
   - Record 5 solves with times: `10.00`, `11.00`, `12.00`, `13.00`, `DNF`. Verify `ao5` trims the DNF as worst, trims `10.00` as best, and calculates average of `11, 12, 13` ($12.00$).
   - Add a second `DNF` to the window. Verify `ao5` displays `"DNF"`.
6. **Mobile Viewport URL Bar Test**: Open mobile layout in Chrome on Android. Scroll the drawer up and down so the address bar hides and shows; verify the bottom peek bar and action buttons remain fully visible and clickable without getting hidden beneath the browser bezel.
