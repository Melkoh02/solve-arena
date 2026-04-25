# Claude Code Instructions

## Project Overview
Solve Arena — a speedcube timer with solo and multiplayer modes. React 19 + Vite + TypeScript on the client, Express + socket.io on the server. MUI v7 for UI, MobX for state, react-i18next for i18n (en + es), `cubing` for scramble generation. Client persists to `localStorage`; the server is stateless apart from in-memory rooms.

## Git Workflow

### Branches
- `master` — stable releases only. Never push directly. Receives merges from `develop`. Pushed to GitHub Pages by CI on every push.
- `develop` — integration branch. All work merges here first before going to `master`.
- `feat/<name>` — feature branches. Branch from `develop`, merge back into `develop`.
- `fix/<name>` — bug fix branches. Branch from `develop`, merge back into `develop`.
- `refactor/<name>` — restructure without behavior change. Branch from `develop`.

### Branch Lifecycle

**For bug fixes (e.g., timer not stopping, history reordering):**
1. `git checkout develop && git checkout -b fix/<name>`
2. Make changes, commit.
3. When done: merge into `develop`. Do NOT merge directly into `master`.

**For features (e.g., adding a stat, a new shortcut):**
1. `git checkout develop && git checkout -b feat/<name>`
2. Make changes, commit.
3. When done: merge into `develop`. Do NOT merge directly into `master`.

**Multiple branches can coexist on `develop`.** Features and fixes accumulate on `develop` until the user decides to cut a release. There is no schedule — the user explicitly says when to release.

### Versioning (Semantic Versioning)

The version number is decided at release time, not when creating branches. Look at everything on `develop` since the last release and apply these rules:

- **Patch (X.Y.Z+1)** — only bug fixes, no new features. Example: 1.0.1 → 1.0.2.
- **Minor (X.Y+1.0)** — new features added, existing features still work the same. Example: 1.0.2 → 1.1.0.
- **Major (X+1.0.0)** — breaking changes that could affect saved data (localStorage shape, settings format). Example: 1.1.0 → 2.0.0.

When in doubt, ask the user what version they want.

### Release Process

Only start this when the user explicitly says to release.

1. On `develop`, ensure all feature/fix branches are merged and everything is tested.
2. Determine version number based on changes since last release (see Versioning above).
3. Bump `version` in `package.json` on `develop` and commit: `git commit -m "chore: bump version to vX.Y.Z"`.
4. Merge to master: `git checkout master && git merge develop --no-ff -m "release: vX.Y.Z"`.
5. Tag the release: `git tag vX.Y.Z`.
6. Push master and tags: `git push origin master --tags` — triggers GitHub Actions to deploy to GitHub Pages.
7. Sync develop: `git checkout develop && git merge master && git push origin develop`.

### Deployment
Pushing to `master` triggers `.github/workflows/deploy.yml`, which builds the client (`yarn build`) and deploys to GitHub Pages (custom domain `solvearena.net` per `CNAME`). The Express server (multiplayer) deploys separately on Render via `render.yaml`.

`VITE_SOCKET_URL` is a build-time secret pointing at the Render server.

### Commit Messages
Use conventional commits, no co-author line:
- `feat:` — new feature
- `fix:` — bug fix
- `refactor:` — code restructure without behavior change
- `perf:` — performance improvement
- `docs:` — documentation only
- `chore:` — build/config changes

## Code Standards

### Architecture
- Components grouped by feature: `src/components/{timer,room,solo,settings,organisms}/`. No atomic design.
- Screens in `src/pages/` (App.tsx, SoloScreen.tsx, etc.), routed via `react-router-dom`.
- Stores in `src/lib/stores/`, all accessed through the `useStore()` hook (`src/lib/hooks/useStore.ts`) which reads from the `StoreContext` set up in `src/main.tsx`.
- Utilities in `src/lib/utils/`, types in `src/lib/types/`, shared constants in `src/lib/constants/`.
- Themes in `src/themes/` — three factories (`createDarkTheme`, `createLightTheme`, `createGlassTheme`) each taking a `ThemeTokens` object so user customization cascades.
- Multiplayer server: a single `server/index.ts` (Express + socket.io). Stateless deploy — rooms are in-memory.

### Patterns
- Components that read MobX state must be wrapped in `observer()` from `mobx-react-lite`. Without it, the component won't re-render when observables change.
- Read store state inside the render: `const { settingsStore } = useStore();` then `settingsStore.foo`.
- All user-visible strings must use `useTranslation()` from `react-i18next`. Keys live in `src/localization/locales/{en,es}.json`. **Always update both files** for any new key.
- Use MUI components (`Box`, `Stack`, `Typography`, `Button`, `IconButton`, `Dialog`, etc.) — don't drop down to raw `<div>` / `<button>` when a MUI primitive fits.
- Colors always from the theme: `sx={{ color: 'primary.main' }}` or `theme.palette.X`. Never hardcode hex/rgba in component code — those values won't follow theme switches or user palette overrides.
- Translucent variants of `palette.primary.main`: use `alpha(theme.palette.primary.main, 0.x)` from `@mui/material/styles`. Never write a literal `rgba(255, 105, 180, ...)` — it'll desync from custom primary colors.
- Persisted client state uses keys prefixed with `@M003:` (see `src/lib/constants/index.ts`). When adding a new persisted setting, define the key there, not inline.

### Stores (MobX)
- `themeStore` — scheme (`light` / `dark` / `glass`) + per-scheme palette overrides. Persists to `@M003:user-theme` and `@M003:user-palette`.
- `settingsStore` — timer/display/shortcut preferences. Persists to `@M003:settings`.
- `userStore` / `languageStore` / `serverStore` — user identity, locale, server status.
- `soloStore` — solo solves and scrambles, persisted to `@M003:solves`.
- `roomStore` — multiplayer state, ephemeral, driven by socket events.
- `timerStore` — current timer phase (`idle` / `preparing` / `ready` / `running` / `stopped`) and display time. Ephemeral.
- `rootStore` — composes them all. `useStore()` returns this.

When adding a new setting:
1. Add the field + default in `src/lib/constants/settingsDefaults.ts`.
2. Add observable + setter + reset logic in `settingsStore`.
3. Persist via the existing `saveToStorage` / `loadFromStorage` round-trip.
4. Read in components via `useStore().settingsStore.X`.

### Theming
- Three theme factories take a `ThemeTokens` object (`primary`, `background`, `backgroundAccent`, `surface`, `textPrimary`, `textSecondary`, `success`, `error`).
- `themeStore.theme` is rebuilt from `tokensFor(scheme)` on every read, so any token override flows through immediately.
- Glass theme has a wallpaper gradient using `background` + `backgroundAccent`. Other schemes ignore `backgroundAccent`.
- When customizing a component override, derive primary-tinted values via `alpha(tokens.primary, x)` and primary-shade variants via `lighten`/`darken` from `@mui/material/styles`. This is what makes user-chosen primary cascade end-to-end.

### Keyboard Shortcuts
- All user-rebindable shortcuts live in `settingsStore.shortcuts` (see `ShortcutId` in `src/lib/constants/settingsDefaults.ts`).
- Match incoming `KeyboardEvent`s against bindings via `matchesShortcut(e, binding)` from `src/lib/utils/shortcuts.ts`.
- For color-key handlers (timer flow), use `getColorFromEvent(e, bindings)`.
- Don't add a new keyboard handler with hardcoded keys — register the binding in `SHORTCUT_DEFAULTS`, surface it in the Settings → Shortcuts UI, and read it from the store.
- Space and Escape stay non-configurable (they're structural to the timer flow).

### Multiplayer
- Server is the source of truth for room state. Client `roomStore` mirrors it via socket events.
- Don't trust client timestamps for ranking — the server stamps solve completion.
- After a reconnection, MobX `playerId` is the canonical identity; `socket.id` may be stale (see prior reconnection bugs in commit history).

## Quality Checklist
Before any commit:
1. `yarn format` — Prettier
2. `yarn lint` — ESLint
3. `yarn build` — runs `tsc -b` (typecheck) + Vite production build. Must succeed.

For UI changes:
4. Run `yarn dev` and exercise the feature in a browser, including the golden path AND edge cases.
5. Test in both Solo and Multiplayer when the change touches shared components (Timer, ScrambleDisplay, etc.).
6. Test all three themes when the change touches styling — light, dark, glass.

For shortcuts changes:
7. Verify the shortcut doesn't fire when an input/textarea is focused.
8. Verify it doesn't fire while the timer is running (unless that's intentional, like a stop key).
