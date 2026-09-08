# Glossary

The vocabulary the rest of the codebase assumes you already know. Read this before `flows.md` or `architecture.md`.

> **Conventions**
> Field names in this doc reference actual properties and columns in the source code — search them by name to find usages. Anywhere a value is "computed, not stored", the canonical formula and calculation rules are defined here.

---

## Table of Contents

- [1. Events & Puzzles](#1-events--puzzles)
- [2. Scrambles & Navigation Stack](#2-scrambles--navigation-stack)
- [3. Solves, Penalties & Effective Time](#3-solves-penalties--effective-time)
- [4. Cross Color & First Layer](#4-cross-color--first-layer)
- [5. Averages & Session Statistics](#5-averages--session-statistics)
- [6. Timer Phases & State Machine](#6-timer-phases--state-machine)
- [7. Room & Multiplayer Domain](#7-room--multiplayer-domain)
- [8. Socket.IO Protocol & Event Dictionary](#8-socketio-protocol--event-dictionary)
- [9. Settings, Storage Keys & Defaults](#9-settings-storage-keys--defaults)
- [10. Keyboard Shortcuts & Input Guards](#10-keyboard-shortcuts--input-guards)

---

## 1. Events & Puzzles

Solve Arena supports the standard World Cube Association (WCA) puzzle events. The canonical event list lives in `src/lib/constants/wcaEvents.ts` (`WCA_EVENTS`).

### Supported Events

| Event ID | Event Name | Puzzle Category      | 2D/3D Preview Puzzle ID (`cubing/twisty`) |
| :------- | :--------- | :------------------- | :---------------------------------------- |
| `222`    | 2x2x2      | NxNxN Cube           | `2x2x2`                                   |
| `333`    | 3x3x3      | NxNxN Cube (Default) | `3x3x3`                                   |
| `444`    | 4x4x4      | NxNxN Cube           | `4x4x4`                                   |
| `555`    | 5x5x5      | NxNxN Cube           | `5x5x5`                                   |
| `666`    | 6x6x6      | NxNxN Big Cube       | `6x6x6`                                   |
| `777`    | 7x7x7      | NxNxN Big Cube       | `7x7x7`                                   |
| `333bf`  | 3x3 BLD    | Blindfolded          | `3x3x3`                                   |
| `333fm`  | 3x3 FMC    | Fewest Moves         | `3x3x3`                                   |
| `333oh`  | 3x3 OH     | One-Handed           | `3x3x3`                                   |
| `clock`  | Clock      | Other WCA            | `clock`                                   |
| `minx`   | Megaminx   | Dodecahedron         | `megaminx`                                |
| `pyram`  | Pyraminx   | Tetrahedron          | `pyraminx`                                |
| `skewb`  | Skewb      | Corner-turning       | `skewb`                                   |
| `sq1`    | Square-1   | Shape-shifter        | `square1`                                 |
| `444bf`  | 4x4 BLD    | Big Cube BLD         | `4x4x4`                                   |
| `555bf`  | 5x5 BLD    | Big Cube BLD         | `5x5x5`                                   |
| `333mbf` | 3x3 MBLD   | Multi-Blind          | `3x3x3`                                   |

### `DEFAULT_EVENT`

`333` ("3x3x3") is the default event on both solo mode initialization and initial multiplayer room creation.

### Event Switching Invariant

In solo mode, changing events (`soloStore.changeEvent(eventId)`) filters the displayed solves and rolling statistics to only solves with `event === eventId`. Solves from other events remain untouched in `localStorage`. In multiplayer mode, only the room host can change the event (`change-event` socket event), which immediately generates a new scramble for that event and increments `currentRound`.

---

## 2. Scrambles & Navigation Stack

### Random-State Scramble

A sequence of moves generated to bring the puzzle into a truly random permutation, compliant with official WCA regulations.

- **Client-Side Generation (Primary)**: Uses `cubing/scramble`'s `randomScrambleForEvent(eventId)`. Loaded via dynamic `import('cubing/scramble')` to keep initial bundle size lean and enable full offline functionality.
- **Server-Side Generation (Fallback)**: If the client bundle fails to load or error occurs, fallback requests `GET ${SOCKET_URL}/api/scramble/:eventId`. In multiplayer rooms, the server is always authoritative for scrambles and runs `randomScrambleForEvent` inside `server/index.ts`.

### `scrambleStack` & `scrambleStackIndex` (Solo Mode Navigation)

A per-session scramble history buffer on `SoloStore` introduced in v1.4.0 that enables non-destructive scramble stepping:

- **`scrambleStack[0]` (Prev-floor)**: Seeded with the scramble of the most recently completed solve (`soloStore.lastSolve?.scramble`). When a user accidentally hits space and aborts, pressing "Previous" steps back to this floor so they can redo the solve.
- **Prev Navigation (`prevScramble`)**: Decrements `scrambleStackIndex`. Can step back at most one position to index 0. Disabled (`canPrevScramble = false`) when at index 0 or when a custom scramble is active.
- **Next Navigation (`nextScramble`)**: Increments `scrambleStackIndex`. If already at the end of the stack (`scrambleStackIndex === scrambleStack.length - 1`), calls `generateScramble({ append: true })` to push a fresh random scramble to the stack. Unlimited forward generation.
- **Solve Binding Rule**: When the timer starts, the solve binds immutably to whatever string is currently in `currentScramble` (`scrambleStack[scrambleStackIndex]`).
- **Post-Solve Stack Reset**: Upon solve completion, the stack is recreated with `[completedScramble, freshGeneratedScramble]` and `scrambleStackIndex = 1`.

### Custom Scramble (`isCustomScramble`)

Users can input their own scramble via the edit dialog (`ScrambleDisplay` on desktop, `ScrambleActionSheet` on mobile). When active:

- `isCustomScramble = true`.
- Prev and Next navigation buttons are disabled.
- Once the solve is completed or manually submitted, `isCustomScramble` is automatically reset to `false`, restoring the random generator.
- Custom scrambles are suppressed in multiplayer rooms where the server mandates identical scrambles for all competitors.

### Scramble Preview (2D / 3D Visualization)

Renders a visual representation of the scrambled puzzle state using `cubing/twisty` (`TwistyPlayer`):

- Visualization mode: `2D` planar diagram with `controlPanel: 'none'`, `background: 'none'`, and `hintFacelets: 'none'`.
- Scramble algorithm is applied and advanced to the final state via `player.jumpToEnd()`.
- Keyboard toggle: configurable via `shortcuts.holdScramblePreview` (hold key down) and `shortcuts.toggleScramblePreview` (persistent toggle, default `Ctrl+E`). State persists to `localStorage` under `scramblePreviewVisible`.

---

## 3. Solves, Penalties & Effective Time

### Data Structures

```typescript
// Solo solve (stored locally in client localStorage)
interface SoloSolve {
  id: string; // crypto.randomUUID()
  time: number; // Raw measured time in milliseconds (elapsed wall clock)
  penalty: Penalty; // 'none' | '+2' | 'DNF'
  scramble: string; // Scramble sequence used
  event: string; // WCA event ID (e.g. '333')
  date: number; // Date.now() timestamp
  crossColor: CrossColor; // 'w' | 'y' | 'r' | 'o' | 'b' | 'g'
  online?: boolean; // True if synced from a multiplayer room
}

// Room solve (ephemeral in server memory, synced across competitors)
interface RoomSolve {
  id: string;
  playerId: string; // Current socket ID of the competitor
  playerName: string; // Display name of competitor
  time: number;
  penalty: Penalty;
  round: number; // Round number in the room (1-based)
  scramble: string;
  date: number;
  crossColor?: CrossColor;
}
```

### Penalties (`Penalty`)

- `'none'`: Clean solve without infraction.
- `'+2'`: 2-second penalty added to recorded time (e.g., misaligned face > 45° at stop, or 0–2 second overrun during inspection).
- `'DNF'` ("Did Not Finish"): Solve invalidated (e.g., cube unsolved, timer stopped with illegal hands, or > 2 second overrun during inspection).

### Effective Time (`getEffectiveTime`)

The mathematical value used across all calculations, averages, personal best comparisons, and room winner rankings:

$$\text{effectiveTime}(\text{solve}) = \begin{cases} \infty & \text{if } \text{penalty} = \text{'DNF'} \\ \text{time} + 2000 & \text{if } \text{penalty} = \text{'+2'} \\ \text{time} & \text{if } \text{penalty} = \text{'none'} \end{cases}$$

```typescript
export function getEffectiveTime(solve: {
  time: number;
  penalty: Penalty;
}): number {
  if (solve.penalty === 'DNF') return Infinity;
  return solve.penalty === '+2' ? solve.time + 2000 : solve.time;
}
```

### Penalty Toggle Semantics

In both Solo and Multiplayer history tables/cards, clicking a penalty toggle that is already active resets the penalty back to `'none'`:

```typescript
solve.penalty = solve.penalty === nextPenalty ? 'none' : nextPenalty;
```

### Formatting Rules (`formatTime` & `getDisplayTime`)

- Sub-minute times format as `s.cc` (e.g. `9.42`) or `s.c` (precision 1: `9.4`).
- Times $\ge 60$ seconds format as `m:ss.cc` (e.g. `1:04.18`).
- For display, `+2` appends a trailing `+` (e.g. `11.42+`), while `DNF` renders literal text `"DNF"`.

### Manual Time Input Parsing (`parseTimeInput`)

Permits manual entry of times from external physical timers (e.g. StackMat) up to `MAX_TIME_MS = 3_599_990` (59:59.99):

1. **Decimal string** (`10.80`): parsed as seconds $\rightarrow 10,800\text{ ms}$.
2. **Colon string** (`1:25.40`): parsed as `minutes : seconds` $\rightarrow 85,400\text{ ms}$.
3. **Raw digits** (`12540`): last 2 digits are centiseconds, next 2 are seconds, remaining are minutes $\rightarrow 1\text{m } 25\text{s } 40\text{cs} = 85,400\text{ ms}$. `75` $\rightarrow 750\text{ ms}$.

---

## 4. Cross Color & First Layer

Speedcubers track which face color was used to build the CFOP cross or Roux first block.

### `CrossColor` Union

```typescript
type CrossColor = 'w' | 'y' | 'r' | 'o' | 'b' | 'g';
```

| Key   | Color Name | Hex Code  | Default Binding |
| :---- | :--------- | :-------- | :-------------- |
| `'w'` | White      | `#FFFFFF` | `W`             |
| `'y'` | Yellow     | `#FFD500` | `Y`             |
| `'r'` | Red        | `#E00000` | `R`             |
| `'o'` | Orange     | `#FF8C00` | `O`             |
| `'b'` | Blue       | `#0051BA` | `B`             |
| `'g'` | Green      | `#009E60` | `G`             |

### Capture & Synchronization Semantics

1. **Arming Capture**: Pressing a color key while the timer is in `inspecting` or `preparing` arm-state captures that color into `pendingColorRef`. When the timer starts, the solve inherits this cross color.
2. **Post-Solve Assignment**: Tapping a color key after stopping in solo mode immediately updates `soloStore.lastSolve.crossColor`. In room mode after submitting, tapping a color key updates `roomStore.myCurrentRoundSolve` (or queues into `pendingColorForRoundRef` if the server broadcast is still in-flight).
3. **Multiplayer Broadcast**: Emits `update-cross-color` to the server; server updates the solve in `room.solves` and broadcasts `room-state` so all competitor tables display the color swatch.

---

## 5. Averages & Session Statistics

Solve Arena uses the official WCA trimmed mean computation for rolling averages. The canonical implementation is in `src/lib/utils/averages.ts`.

### `calculateAverage(solves, count, maxDnf)`

Calculates a trimmed mean over the newest `count` solves:

- Input solves must be ordered **newest-first**.
- If available solves $< count$, returns `null` (displayed as `"-"`).
- Maps solves to `getEffectiveTime`.
- If the count of non-finite times (`Infinity` from DNFs) is $\ge maxDnf$, the average returns `Infinity` (rendered as `"DNF"`).
- Sorts the `count` effective times in ascending numeric order.
- Trims **1 best time** (index 0) and **$maxDnf - 1$ worst times** from the end:
  $$\text{trimmed} = \text{sorted.slice}(1, \text{sorted.length} - (maxDnf - 1))$$
- Returns the arithmetic mean of the remaining elements:
  $$\text{avg} = \frac{\sum \text{trimmed}}{\text{trimmed.length}}$$

### Specific Average Types

#### Average of 5 (`ao5`)

- Parameters: `count = 5`, `maxDnf = 2`.
- Trims: 1 lowest (best) and 1 highest (worst).
- Computes mean of middle 3 solves.
- DNF rule: Exactly 1 DNF is treated as the single worst solve and trimmed away. 2 or more DNFs yield an overall `ao5` of `DNF`.

#### Average of 12 (`ao12`)

- Parameters: `count = 12`, `maxDnf = 3`.
- Trims: 1 lowest (best) and 2 highest (worst).
- Computes mean of middle 9 solves.
- DNF rule: 1 or 2 DNFs are treated as the worst solves and trimmed away. 3 or more DNFs yield an overall `ao12` of `DNF`.

### Session Aggregates

- **`bestTime`**: Minimum finite `getEffectiveTime` for the current event.
- **`globalAverage`**: Simple arithmetic mean of all completed finite solves for the current event:
  $$\text{globalAverage} = \frac{\sum_{s \in \text{eventSolves}, \text{eff}(s) < \infty} \text{eff}(s)}{N_{\text{finite}}}$$
- **`previousSolves`**: A 4-slot stack of the most recent completed solves preceding the current one (`eventSolves.slice(-5, -1).reverse()`).
- **`historyRows`**: Rolling evaluation for table display. For each solve $i$ (from newest down to 0), evaluates `ao5` and `ao12` using a sliding window of at most 12 solves: `es.slice(Math.max(0, i - 11), i + 1).reverse()`.
- **Personal Best (PB)**: Checked whenever a solve completes (`checkPb` in solo, `checkForPb` in room). The very first solve establishes a baseline and does not fire a PB notification. Any subsequent solve with $\text{eff} < \text{prevBest}$ pushes a `PbNotification` which renders as a toast snackbar.

---

## 6. Timer Phases & State Machine

The timer engine runs a strict phase machine managed by `TimerStore` (`src/lib/stores/timerStore.ts`).

```
                    ┌────────────────────────┐
                    │          idle          │◄───────────────────────┐
                    └───────────┬────────────┘                        │
                                │                                     │
           Inspection enabled?  │  Inspection disabled                │
        ┌───────────────────────┴────────────────────────┐             │
        ▼                                                ▼             │
┌───────────────┐                             ┌─────────────────────┐ │
│  inspecting   │                             │ preparing (holding) │ │
└───────┬───────┘                             └──────────┬──────────┘ │
        │ arm (hold space/color)                         │ threshold  │
        ▼                                                ▼   passed   │
┌───────────────┐                             ┌─────────────────────┐ │
│  inspecting   │───[release key]────────────►│        ready        │ │
│    (armed)    │                             └──────────┬──────────┘ │
└───────┬───────┘                                        │ release    │
        │ overrun > 2s                                   ▼            │
        │                                     ┌─────────────────────┐ │
        │                                     │       running       │ │
        │                                     └──────────┬──────────┘ │
        │                                                │ keydown/   │ cancelRunning
        │                                                │ touch      │ (Backspace/Del)
        │                                                ▼            │
        │                                     ┌─────────────────────┐ │
        └────────────────────────────────────►│       stopped       │─┴─────────┘
                                              └─────────────────────┘
```

### Phase Definitions (`TimerPhase`)

| Phase          | Display Color                                                                | Meaning                                                           | Allowed Next Transitions                                             |
| :------------- | :--------------------------------------------------------------------------- | :---------------------------------------------------------------- | :------------------------------------------------------------------- |
| `'idle'`       | Theme Text                                                                   | Resting state at `0.00`                                           | `'inspecting'`, `'preparing'`, `'ready'`                             |
| `'inspecting'` | Orange (`#ffa726`), Red on overrun (`#f44336`), Green when armed (`#4caf50`) | WCA countdown (5–60s) ticking down                                | `'idle'` (Escape), `'stopped'` (overrun DNF), `'ready'`, `'running'` |
| `'preparing'`  | Red (`#f44336`)                                                              | Start key/touch held down; waiting for hold threshold timer       | `'ready'` (timer fires), `'idle'`/`'stopped'` (released early)       |
| `'ready'`      | Green (`#4caf50`)                                                            | Held long enough; armed and ready to start immediately on release | `'running'` (key/touch released), `'idle'` (Escape)                  |
| `'running'`    | Theme Text + Glow                                                            | Timer counting up via `requestAnimationFrame` loop                | `'stopped'` (key/touch), `'idle'` (`cancelRunning`)                  |
| `'stopped'`    | Theme Text (or Red if DNF)                                                   | Solve finished; display time static; submission reactions firing  | `'idle'` (Escape), `'inspecting'`, `'preparing'`, `'ready'`          |

### Special Flags & State Machine Rules

- **`spacebarRequiresHold`**: Setting toggle. When `false` (default), pressing spacebar bypasses `'preparing'` (red) and transitions instantaneously to `'ready'` (green). When `true`, spacebar requires holding for `colorKeyHoldThreshold` ms before turning green.
- **`colorKeyHoldThreshold`**: Clamped between 100ms and 2000ms (default: 500ms). Color keys always require this hold threshold to prevent accidental arming while typing.
- **`cancelRunning()`**: Pressing `Backspace` or `Delete` while `timerPhase === 'running'` aborts the timer directly to `'idle'`. Because it never enters `'stopped'`, MobX reactions that submit solves never execute, leaving no trace of the aborted run.
- **`cancelInspection()`**: Pressing `Escape` during inspection returns to `'idle'`.
- **Inspection Overrun Penalties**:
  - Overrun $\le 2000\text{ ms}$: records `inspectionPenalty = '+2'`. The subsequent solve is tagged with a `+2` penalty.
  - Overrun $> 2000\text{ ms}$: triggers `forceDnfFromInspection()`, advancing directly to `'stopped'` with `lastStopWasDnf = true`.

---

## 7. Room & Multiplayer Domain

Multiplayer logic is coordinated between the client `RoomStore` and the authoritative Node.js server (`server/index.ts`).

### Room Code

A unique 4-character uppercase alphanumeric code generated from:

```typescript
const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
```

Characters `I`, `O`, `0`, and `1` are intentionally excluded to prevent visual ambiguity.

### Room Roles & Lifecycle

- **Host (`hostId`)**: The player who created the room. Only the host can invoke `change-event`, `next-scramble`, `reset-room`, and `kick-player`.
- **Host Migration**: If the current host leaves or their disconnection grace period expires, the server automatically promotes the next available connected player (`!p.disconnected`) to host and broadcasts the updated state.
- **Empty Room Garbage Collection**: When `room.players.size === 0`, the room entry is deleted from the server's `rooms` Map.

### Competitor Statuses

- **`idle` ("Waiting")**: Competitor has not started their solve for the current round.
- **`solving` ("Solving...")**: Client emitted `timer-start`; competitor's timer is actively running.
- **`finished` ("Finished")**: Competitor submitted their time for `currentRound`.
- **`disconnected` ("Disconnected")**: Network connection dropped; competitor is within the grace period.

### Auto-Advance Barrier

Rounds progress automatically without requiring manual host intervention:

1. Each client emits `submit-time` upon solve completion.
2. Server appends the solve to `room.solves`.
3. Server evaluates:
   $$\text{submittedCount} \ge \text{connectedPlayers.length}$$
4. When all active connected players have submitted, the server generates the next scramble (`generateScramble(room.eventId)`), increments `room.currentRound += 1`, and broadcasts `room-state`.

### Disconnect Grace Period (`DISCONNECT_GRACE_MS` = 30,000 ms)

When a socket disconnects unexpectedly:

1. The server flags `player.disconnected = true` and starts a 30-second timer.
2. If the user reconnects within 30 seconds via `rejoin-room` passing their `oldPlayerId`:
   - The old identity is transferred to the new socket ID.
   - Any solves associated with `oldPlayerId` are rebound to the new socket ID.
   - If the player was host, `room.hostId` is updated to the new socket ID.
   - Any stale existing socket matching `oldPlayerId` is forcibly closed to eliminate duplicate "ghost" players (resolving mobile background wake races).
   - The grace timer is cleared.
3. If the grace timer fires before reconnection, the player is fully excised from `room.players`.

### Deep Link Joining

Sharing `https://solvearena.net/room/<CODE>` deep-links directly into the arena:

- If the user already has a saved `playerName` in `localStorage`, `RoomScreen` mounts and auto-joins immediately.
- If no player name exists, the user is redirected to `/` with router state `{ joinCode: code }`, automatically opening the Compete popover with the code prefilled and name input focused.

---

## 8. Socket.IO Protocol & Event Dictionary

### Client to Server (`ClientToServerEvents`)

| Event                | Payload                                                         | Response Callback                           | Purpose                                         |
| :------------------- | :-------------------------------------------------------------- | :------------------------------------------ | :---------------------------------------------- |
| `create-room`        | `{ playerName: string }`                                        | `{ roomCode: string } \| { error: string }` | Creates a new room; client becomes host         |
| `join-room`          | `{ roomCode: string, playerName: string }`                      | `{ success: boolean } \| { error: string }` | Joins existing room as standard player          |
| `rejoin-room`        | `{ roomCode: string, playerName: string, oldPlayerId: string }` | `{ success: boolean } \| { error: string }` | Restores identity after disconnect              |
| `leave-room`         | `void`                                                          | `void`                                      | Explicit exit; removes player immediately       |
| `timer-start`        | `void`                                                          | `void`                                      | Broadcasts solving status to opponents          |
| `submit-time`        | `{ time: number, dnf?: boolean }`                               | `void`                                      | Submits solve for `currentRound`                |
| `update-penalty`     | `{ solveId: string, penalty: Penalty }`                         | `void`                                      | Toggles penalty on own submitted solve          |
| `update-cross-color` | `{ solveId: string, crossColor: CrossColor }`                   | `void`                                      | Tags cross color on own submitted solve         |
| `change-event`       | `{ eventId: string }`                                           | `void`                                      | Host only: changes puzzle, gets new scramble    |
| `next-scramble`      | `void`                                                          | `void`                                      | Host only: discards scramble, advances round    |
| `reset-room`         | `void`                                                          | `void`                                      | Host only: purges all solves, resets to Round 1 |
| `kick-player`        | `{ playerId: string }`                                          | `void`                                      | Host only: removes competitor from room         |

### Server to Client (`ServerToClientEvents`)

| Event            | Payload                | Purpose                                                   |
| :--------------- | :--------------------- | :-------------------------------------------------------- |
| `room-state`     | `RoomState`            | Full authoritative room state broadcast on every mutation |
| `player-solving` | `{ playerId: string }` | Informs opponents that competitor started timing          |
| `kicked`         | `void`                 | Notifies kicked client to disconnect and route home       |
| `error`          | `{ message: string }`  | General error message payload                             |

---

## 9. Settings, Storage Keys & Defaults

All persistent client data uses keys prefixed with `@M003:` (defined in `src/lib/constants/index.ts` and store modules).

### Storage Keys

| Key Constant          | Storage Key String       | Managing Store            | Stored Data Schema                             |
| :-------------------- | :----------------------- | :------------------------ | :--------------------------------------------- |
| `SETTINGS_KEY`        | `@M003:settings`         | `SettingsStore`           | JSON of `AppSettings`                          |
| `THEME_KEY`           | `@M003:user-theme`       | `ThemeStore`              | `'light' \| 'dark' \| 'glass'`                 |
| `PALETTE_KEY`         | `@M003:user-palette`     | `ThemeStore`              | JSON of `Record<Scheme, Partial<ThemeTokens>>` |
| `PLAYER_NAME_KEY`     | `@M003:player-name`      | `RoomStore` / `SoloStore` | Raw string (competitor display name)           |
| `LANGUAGE_KEY`        | `@M003:user-language`    | `LanguageStore` / i18n    | `'en' \| 'es'`                                 |
| `USER_STORAGE_KEY`    | `@M003:user-store`       | `UserStore`               | JSON auth tokens & user profile                |
| `SOLO_SOLVES_KEY`     | `soloSolves`             | `SoloStore`               | JSON array of `SoloSolve`                      |
| `SOLO_EVENT_KEY`      | `soloEventId`            | `SoloStore`               | String WCA event ID (e.g. `'333'`)             |
| `PREVIEW_KEY`         | `scramblePreviewVisible` | Components / Hook         | `'true' \| 'false'`                            |
| `HISTORY_VISIBLE_KEY` | `soloHistoryVisible`     | `SoloScreen`              | `'true' \| 'false'`                            |

### AppSettings Schema & Defaults (`SETTINGS_DEFAULTS`)

```typescript
export const SETTINGS_DEFAULTS: Readonly<AppSettings> = Object.freeze({
  // Timer behaviors
  colorKeyHoldThreshold: 500, // ms hold duration before turning green (100–2000ms)
  spacebarRequiresHold: false, // false = spacebar arms green instantly on press
  inspectionEnabled: false, // false = standard timing; true = WCA countdown
  inspectionDuration: 15, // seconds for inspection countdown (5–60s)

  // Display options
  timerPrecision: 2, // 2 = 0.00 (centiseconds), 1 = 0.0 (deciseconds)
  timeFormat: 'auto', // 'auto' = s.cc or m:ss.cc; 'mm:ss.xx' = fixed minutes

  // Layout mode
  layoutMode: 'auto', // 'auto' (<600px mobile), 'mobile', 'desktop'

  // Shortcut bindings (ShortcutBindings)
  shortcuts: SHORTCUT_DEFAULTS,
});
```

---

## 10. Keyboard Shortcuts & Input Guards

Solve Arena features user-rebindable keyboard shortcuts managed by `SettingsStore.shortcuts`.

### Default Shortcut Table (`SHORTCUT_DEFAULTS`)

| Shortcut ID             | Purpose                            | Default Key Binding         | Configurable?       |
| :---------------------- | :--------------------------------- | :-------------------------- | :------------------ |
| `colorWhite`            | Tag solve with White cross         | `W`                         | Yes                 |
| `colorYellow`           | Tag solve with Yellow cross        | `Y`                         | Yes                 |
| `colorRed`              | Tag solve with Red cross           | `R`                         | Yes                 |
| `colorOrange`           | Tag solve with Orange cross        | `O`                         | Yes                 |
| `colorBlue`             | Tag solve with Blue cross          | `B`                         | Yes                 |
| `colorGreen`            | Tag solve with Green cross         | `G`                         | Yes                 |
| `deleteLastSolve`       | Delete most recent solve in event  | `Backspace`                 | Yes                 |
| `clearAllSolves`        | Clear all event solves             | `Ctrl+Shift+Backspace`      | Yes                 |
| `holdScramblePreview`   | Hold to preview 2D scramble        | `E`                         | Yes                 |
| `toggleScramblePreview` | Toggle persistent 2D preview       | `Ctrl+E`                    | Yes                 |
| `toggleHistory`         | Toggle desktop history panel       | `H`                         | Yes                 |
| _Timer Arm/Start_       | Prepare / ready / start timer      | `Space`                     | **No** (Structural) |
| _Timer Stop_            | Stop running timer                 | Almost any non-modifier key | **No** (Structural) |
| _Timer Stop + DNF_      | Stop running timer as DNF          | `Escape`                    | **No** (Structural) |
| _Cancel Inspection_     | Abort inspection back to idle      | `Escape`                    | **No** (Structural) |
| _Cancel Running_        | Abort running solve without saving | `Backspace` or `Delete`     | **No** (Structural) |

### Input Protection & Focus Blur Invariant

To prevent keystrokes from firing during text entry or triggering accidental button clicks:

1. **Interactive Element Guard**: If `event.target` matches `INPUT`, `TEXTAREA`, or `SELECT`, shortcuts do not fire.
2. **Button Defocus on Space**: Pressing space while focus is on a `<button>` or an element with `role="button"` (such as MUI `ButtonBase` or `IconButton`) will blur the element immediately on keydown:
   ```typescript
   if (e.code === 'Space' && isButtonLike) {
     e.preventDefault();
     target.blur();
   }
   ```
   This guarantees that the subsequent `keyup` event fires on `document.body`, preventing accidental modal openings or button submissions while operating the timer.
3. **Overlay Isolation**: Keyboard shortcuts do not fire when active focus resides inside a `[role="dialog"]`, `[role="presentation"]`, or `.MuiPopover-root`.
