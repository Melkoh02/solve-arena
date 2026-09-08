# Architecture

The shape of the codebase. Read this _after_ `glossary.md` (vocabulary) and _before_ changing anything load-bearing.

This doc captures the wiring that isn't obvious from reading individual files; everything else is in glossary, flows, or merge-points.

---

## Provider & Component Stack

The client entry point (`src/main.tsx`) and root layout (`src/pages/App.tsx`, `src/routes/routes.tsx`) mount in this strict sequence:

```
StoreContext.Provider (rootStore)       ← MobX singleton with all domain stores
  └── ThemeProvider (themeStore.theme)  ← Rebuilt dynamically on token/scheme change
        └── CssBaseline                 ← MUI CSS reset + glass gradient wallpaper
              └── BrowserRouter         ← React Router v7 with BASE_URL
                    └── AppRoutes       ← 100dvh flex container shell
                          ├── /         ← SoloScreen (Solo Timer + History)
                          └── /room/:code ← RoomScreen (Multiplayer Arena)
```

### Load-Bearing Order Rules

1. **`StoreContext.Provider` must be outermost**: All UI components, hooks (`useStore`, `useIsMobile`), and the theme factory itself depend on reading store state. `rootStore` is instantiated synchronously on module load.
2. **`ThemeProvider` wraps `BrowserRouter`**: Theme context (including `theme.palette`, breakpoints, and custom glass tokens) must be accessible to route-level components, router fallback screens, modals, and toasts.
3. **`themeStore.theme` is a computed getter**: When the user switches schemes (`light`, `dark`, `glass`) or overrides a palette token in Settings, `themeStore.theme` instantly constructs a new MUI `Theme` instance. `ThemeProvider` receives the fresh theme and re-renders the application without page reloads.
4. **`CssBaseline` provides the global glass canvas**: In `glass` mode, `CssBaseline` injects a fixed `body::before` pseudo-element rendering the two-tone diagonal wallpaper gradient (`background` $\rightarrow$ `backgroundAccent` $\rightarrow$ `background`). All subsequent `Paper`, `Dialog`, and surface elements render semi-transparent backgrounds with CSS `backdrop-filter: blur(...)`.
5. **Dynamic Viewport Root**: `AppRoutes` wraps all page content in a `<Box sx={{ ...vhSafe(100), width: '100%', display: 'flex', flex: 1 }}>`. This uses the dynamic viewport unit (`100dvh`) to prevent mobile browser URL bars from clipping bottom navigation bars or history drawers.

---

## Data Flow on Mutations

User actions follow distinct data flow pipelines depending on whether the mode is Solo (local-first) or Multiplayer (server-authoritative).

### 1. Solo Solve Mutation Pipeline

```
1. User input (Spacebar release / Touch release)
     ↓
2. Timer.tsx triggers timerStore.startTimer()
     ↓
3. RAF loop in Timer.tsx updates timerStore.displayTime every animation frame
     ↓
4. Stop trigger (Keyboard keydown / Touch tap)
     ↓
5. Timer.tsx triggers timerStore.stopTimer(isDnf)
     ↓
6. Reaction in SoloScreen.tsx fires on [timerPhase === 'stopped']:
     ├── soloStore.addSolve(displayTime, isDnf, crossColor)
     ├── Appends solve to soloStore.solves array
     ├── Persists array to localStorage ('soloSolves')
     ├── Evaluates PB against previousBestTimes (fires toast if PB)
     └── Invokes soloStore.generateScramble() for the next solve
```

### 2. Multiplayer Solve Mutation Pipeline

```
1. Competitor finishes solve (Timer stops)
     ↓
2. Reaction in RoomScreen.tsx fires on [timerPhase === 'stopped']:
     ├── Optimistically sets pendingSubmissionRound = currentRound
     └── Calls roomStore.submitTime(time, isDnf)
     ↓
3. Client emits 'submit-time' via Socket.IO
     ↓
4. Server (server/index.ts) receives 'submit-time':
     ├── Validates player exists and hasn't already submitted for currentRound
     ├── Appends solve to room.solves array with server timestamp
     ├── Counts submitted players for currentRound vs connected players
     │     └── If ALL connected players have submitted:
     │           ├── Generates next scramble via cubing/scramble
     │           └── Increments room.currentRound += 1
     └── Broadcasts 'room-state' to room room.code
     ↓
5. Client socket receives 'room-state':
     ├── roomStore updates players, solves, currentRound, currentScramble
     ├── Clears pendingSubmissionRound
     └── Reaction in RoomScreen.tsx syncs own solve to soloStore via syncFromRoom()
```

### 3. Disconnect & Reconnection Pipeline

```
1. Mobile browser backgrounded or network dropped
     ↓
2. Server detects disconnect:
     ├── Flags player.disconnected = true
     ├── Starts 30-second grace timer (DISCONNECT_GRACE_MS)
     └── Broadcasts 'room-state' (opponents see "Disconnected" status)
     ↓
3. Client wakes up / reconnects with a NEW socket ID:
     ├── roomStore detects socket 'connect' with pendingRejoinCode
     └── Emits 'rejoin-room' { roomCode, playerName, oldPlayerId }
     ↓
4. Server processes 'rejoin-room':
     ├── Clears 30-second disconnect timer for oldPlayerId
     ├── Transfers oldPlayer identity (including isHost) to the new socket ID
     ├── Re-binds all historical room.solves (solve.playerId = newSocketId)
     ├── Force-disconnects stale abandoned socket if still lingering
     └── Broadcasts updated 'room-state'
     ↓
5. Client resumes seamlessly without losing round history or competitor identity
```

---

## MobX State Architecture

Application state is centrally managed via MobX 6 and consumed through the `useStore()` hook (`StoreContext`). There is no atomic design or Redux boilerplate; stores encapsulate observable state, derived computations (getters), and actions.

```
RootStore (src/lib/stores/rootStore.ts)
├── timerStore     ← Ephemeral timing engine, phase machine, RAF counters
├── soloStore      ← Local solves array, scramble stack, session statistics, PB logic
├── roomStore      ← Socket.IO client, room synchronization, competitor presence
├── settingsStore  ← User preferences, layout mode, timer thresholds, shortcuts
├── themeStore     ← Visual scheme (light/dark/glass), token overrides, color palettes
├── serverStore    ← Backend health ping, Render free-tier cold-start wake tracking
├── userStore      ← User profile & auth token persistence (extensible auth layer)
└── languageStore  ← i18next synchronization (en / es)
```

### Reactivity Invariants

- **Observer Wrapping**: Any React component that reads observables or getters from a store **must** be wrapped in `observer()` from `mobx-react-lite`. Without `observer()`, components will not re-render when observables change.
- **Render-Time Dereferencing**: Always extract store values inside the render function body:
  ```typescript
  const { timerStore, soloStore } = useStore();
  const time = timerStore.displayTime;
  ```
- **Reactions for Side Effects**: Cross-store synchronization (such as submitting a solve when `timerPhase` transitions to `'stopped'` or saving solves to `soloStore` when multiplayer rounds complete) is orchestrated via MobX `reaction()` inside `useEffect` blocks.

---

## Scramble Engine Architecture

Scramble generation is designed to be completely offline-capable while remaining performant and bandwidth-conscious.

```
                      generateScramble(eventId)
                                │
                                ▼
               Dynamic import('cubing/scramble')
                                │
                ┌───────────────┴───────────────┐
                │ Success                       │ Network / Bundle Failure
                ▼                               ▼
    cubing/scramble execution         HTTP GET /api/scramble/:eventId
    (WCA-compliant random state)       (Express server fallback)
                │                               │
                └───────────────┬───────────────┘
                                │
                                ▼
                   Apply to currentScramble
                   Update scrambleStack (solo)
```

### Key Subsystems

1. **Client-First Async Dynamic Import**: `cubing/scramble` contains substantial cryptographic and puzzle table state. Loading it lazily via `await import('cubing/scramble')` prevents bundle bloat on initial page load while ensuring full offline operation once cached.
2. **Server-Side Fallback**: If client-side dynamic import fails, the client makes an HTTP request to `${SOCKET_URL}/api/scramble/${eventId}`. The server runs `randomScrambleForEvent` in Node.js and returns `{ scramble: string }`.
3. **2D Visualization via TwistyPlayer**: When scramble preview is enabled, `ScramblePreview.tsx` dynamically imports `cubing/twisty` (`TwistyPlayer`), instantiates a lightweight 2D diagram without facelet controls, and calls `player.jumpToEnd()` to display the scrambled state.
4. **Solo Navigation Stack (`scrambleStack`)**: Solves are bound to the scramble at start time. The user can step back exactly one scramble (the prev-floor) to redo an accidental solve, or step forward indefinitely.

---

## Responsive Dual-Layout Architecture & Mobile Parity

Solve Arena features dual layouts for both Solo and Room modes:

- **Desktop Layout**: Wide-screen layout with sticky sidebars, multi-column tables, inline icon toolbars, and compact displays.
- **Mobile Layout**: Touch-first ergonomics with full-width action sheets, swipeable bottom drawers, large-display timer fonts (`clamp(5.5rem, 28vw, 10rem)`), and thumb-friendly controls.

### Single Source of Truth: `useIsMobile()`

The decision of which layout to mount is centralized in `src/lib/hooks/useIsMobile.ts`:

```typescript
export function useIsMobile(): boolean {
  const { settingsStore } = useStore();
  const theme = useTheme();
  const viewportIsMobile = useMediaQuery(theme.breakpoints.down('sm'));
  if (settingsStore.layoutMode === 'mobile') return true;
  if (settingsStore.layoutMode === 'desktop') return false;
  return viewportIsMobile;
}
```

### Mobile Parity Invariants

1. **Behavioral Equivalence**: The mobile layout is not restricted to phones; desktop users intentionally use it in narrow or tiled windows. Every feature, keyboard shortcut, and gesture **must work identically** regardless of which layout is active.
2. **Shared Hooks for Subsystem Logic**: Features like scramble preview toggling must live in shared hooks (`useScramblePreviewShortcut`) rather than inside desktop-only or mobile-only components.
3. **Touch vs. Keyboard Symmetry**: The `useTimerTouch` hook implements the identical phase state machine as desktop keyboard events (including inspection countdown, arming on touch, release to start, tap to stop, and DNF overruns).
4. **Mobile Gestures**:
   - **3-Finger Tap**: Tapping the timer area with 3 fingers in solo mode immediately opens a delete-confirmation dialog for the most recent solve.
   - **Drawer Peeking**: History drawers render a compact bottom peek bar displaying `HISTORY (n) · Best · Avg` that expands upward on tap.
5. **Android Viewport Safety (`vhSafe`)**: Standard CSS `100vh` on mobile browsers corresponds to the viewport height when browser chrome (URL bar) is hidden. When the URL bar is visible, `100vh` extends beneath the visible screen, clipping bottom action bars. `vhSafe()` and `minVhSafe()` in `src/lib/utils/viewport.ts` apply `@supports (height: 100dvh)` with fallback to `vh`, ensuring accurate viewport clamping on Android Chrome and iOS Safari.

---

## Theme & Styling Engine Architecture

Solve Arena provides three distinct visual themes: `dark` (cyberpunk navy & pink), `light` (clean pink & gray), and `glass` (translucent glassmorphism over an atmospheric gradient).

```
ThemeStore (src/lib/stores/themeStore.ts)
  │
  ├── scheme: 'light' | 'dark' | 'glass' (Default: 'glass')
  ├── paletteOverrides: Record<Scheme, Partial<ThemeTokens>>
  │
  └── theme getter:
        ├── 'glass' → createGlassTheme(tokens)
        ├── 'light' → createLightTheme(tokens)
        └── 'dark'  → createDarkTheme(tokens)
```

### Theme Tokens Cascade

Every theme is constructed from a concrete `ThemeTokens` structure (`src/themes/tokens.ts`):

- `primary`: Accent color (buttons, active states, timer highlights). Default `#FF69B4`.
- `background`: Body background color.
- `backgroundAccent`: Second gradient stop for wallpaper gradients (used in `glass`).
- `surface`: Background color for Paper surfaces, cards, and modal dialogs.
- `textPrimary` & `textSecondary`: Main and muted typography colors.
- `success` & `error`: Functional semantic status colors.

### Dynamic Token Derivation

To ensure user-customized accent colors cascade cleanly across MUI components:

- Translucent tints are derived dynamically using `alpha(tokens.primary, factor)`.
- Darkened and lightened shades are calculated with `darken()` and `lighten()`.
- Hardcoded hex or rgba strings are strictly prohibited in component code.

---

## Server Architecture (Multiplayer Engine)

The multiplayer backend is implemented in `server/index.ts` using Express 5 and Socket.IO 4.

```
                Socket.IO Server (port 3001 / Render)
                                │
               ┌────────────────┴────────────────┐
               ▼                                 ▼
      rooms (Map<string, Room>)       disconnectTimers (Map)
      ├── code (4 chars)              ├── Timer per playerId
      ├── hostId                      └── 30-second grace window
      ├── eventId ('333')
      ├── currentScramble
      ├── currentRound
      ├── players (Map<id, Player>)
      └── solves (RoomSolve[])
```

### Architectural Principles

- **Stateless Cloud Hosting**: The server is designed to deploy on ephemeral container services (e.g. Render free-tier). Rooms exist purely in server memory and are garbage-collected as soon as all competitors depart.
- **Server-Authoritative Timing & Scrambles**: The server assigns round scrambles and tracks solve completions. Clients cannot dictate round progression or alter other players' records.
- **Free-Tier Wake Detection (`ServerStore`)**: Because Render spins down inactive containers, `ServerStore` polls `/api/health` on initial app launch. The UI displays an interactive status dot (`ServerStatusDot`): green for online, yellow with an elapsed wake counter for waking, red for offline.
- **Tab Invisibility Audio Notification**: When a new multiplayer round begins while a competitor's browser tab is hidden (`document.hidden`), `RoomScreen.tsx` synthesizes an 880 Hz sine wave beep using the browser's Web Audio API (`AudioContext`), alerting the user to switch back.

---

## Directory Layout

```
solve-arena/
├── docs/                   # System documentation (glossary, architecture, merge-points, flows)
├── extra_files/            # Task tracking & progress state
├── server/
│   └── index.ts            # Authoritative Express + Socket.IO multiplayer server
├── src/
│   ├── api/                # Axios HTTP client & endpoint definitions
│   ├── components/
│   │   ├── organisms/      # Standalone composite components (e.g. LanguageSelect)
│   │   ├── room/           # Multiplayer components (ResultsTable, Sidebar, HostControls)
│   │   │   └── mobile/     # Mobile layout components (MobileRoomLayout, Drawers)
│   │   ├── settings/       # Settings dialog & sub-sections (Appearance, Timer, Shortcuts)
│   │   ├── solo/           # Solo mode components (SoloHistory, Modals)
│   │   │   └── mobile/     # Mobile layout components (MobileSoloLayout, HistoryCard)
│   │   └── timer/          # Core timer engine, scramble display, preview, puzzle selector
│   ├── lib/
│   │   ├── constants/      # WCA events, shortcut defaults, cross colors, storage keys
│   │   ├── hooks/          # useStore, useIsMobile, useTimerTouch, useScramblePreviewShortcut
│   │   ├── stores/         # MobX domain stores (root, timer, solo, room, settings, theme)
│   │   ├── types/          # Shared TypeScript interfaces (timer, room, user, theme)
│   │   └── utils/          # Averages math, time formatting, shortcut matching, viewport
│   ├── localization/       # i18next configuration and translations (en, es)
│   ├── pages/              # Screen components (SoloScreen, RoomScreen, LobbyScreen, App)
│   ├── routes/             # React Router routing configuration
│   └── themes/             # MUI theme factories (dark, light, glass) & token definitions
├── index.html              # HTML shell
├── package.json            # Dependencies and build scripts
├── render.yaml             # Render deployment configuration
└── vite.config.ts          # Vite build config with vendor chunk splitting
```

---

## Where to Look for X

| Task                                               | Start Here                                                                                                                       |
| :------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| Add or rename a speedcubing domain concept         | `docs/glossary.md`                                                                                                               |
| Trace or modify a user workflow                    | `docs/flows.md`                                                                                                                  |
| Touch a core file with many converging systems     | `docs/merge-points.md`                                                                                                           |
| Change timer state transitions or countdown logic  | `src/lib/stores/timerStore.ts` & `src/components/timer/Timer.tsx`                                                                |
| Change average calculation formulas (ao5, ao12)    | `src/lib/utils/averages.ts`                                                                                                      |
| Add a new WCA puzzle event                         | `src/lib/constants/wcaEvents.ts` $\rightarrow$ `src/components/timer/ScramblePreview.tsx` (`EVENT_TO_PUZZLE`)                    |
| Add a new configurable setting                     | `src/lib/constants/settingsDefaults.ts` $\rightarrow$ `src/lib/stores/settingsStore.ts` $\rightarrow$ `src/components/settings/` |
| Add a new rebindable keyboard shortcut             | `ShortcutId` in `src/lib/constants/settingsDefaults.ts` $\rightarrow$ `SHORTCUT_DEFAULTS` $\rightarrow$ `ShortcutsSection.tsx`   |
| Modify multiplayer socket events or room behavior  | `src/lib/types/room.ts` $\rightarrow$ `server/index.ts` $\rightarrow$ `src/lib/stores/roomStore.ts`                              |
| Edit theme color tokens or glassmorphism styling   | `src/themes/tokens.ts` $\rightarrow$ `src/themes/glass.ts` $\rightarrow$ `src/lib/stores/themeStore.ts`                          |
| Add user-facing translations                       | `src/localization/locales/en.json` AND `src/localization/locales/es.json` (always both)                                          |
| Fix mobile layout clipping or touch responsiveness | `src/lib/utils/viewport.ts` (`vhSafe`) $\rightarrow$ `src/components/timer/Timer.tsx` (`useTimerTouch`)                          |

---

## When to Update Which Doc

When completing a change or pull request, consult this table:

| Did the change...                                                                                                  | Update                                                                                 |
| :----------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| Add or rename an event, penalty, average type, shortcut, or storage key?                                           | `docs/glossary.md`                                                                     |
| Change a mathematical formula, DNF rule, or timer phase transition rule?                                           | `docs/glossary.md` (and add an inline code comment at the site)                        |
| Add or alter a user flow, gesture, modal dialog, or navigation path?                                               | `docs/flows.md`                                                                        |
| Alter the provider hierarchy, MobX store structure, or socket protocol?                                            | `docs/architecture.md`                                                                 |
| Modify a central file where multiple features converge (`Timer.tsx`, `soloStore`, `roomStore`, `server/index.ts`)? | `docs/merge-points.md`                                                                 |
| Change purely visual styles or layout padding?                                                                     | None                                                                                   |
| Refactor internal code without behavior change?                                                                    | None (docs capture system contracts and behavior, not fleeting implementation details) |
