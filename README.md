# Solve Arena

A multiplayer speedcube timer where you and your friends can compete in real-time. Create a room, share the code, and race against the same scrambles together.

**[Try it live](https://melkoh02.github.io/solve-arena/)**

## Features

- **Multiplayer rooms** — Create or join rooms with a 4-character code
- **All WCA events** — 2x2 through 7x7, Megaminx, Pyraminx, Skewb, Square-1, Clock, BLD, and more
- **WCA-level scrambles** — Random-state scrambles powered by [cubing.js](https://js.cubing.net/cubing/)
- **Spacebar timer** — Hold to ready, release to start, press to stop
- **Live results** — See everyone's times as they finish
- **Auto-advance** — Next scramble generates automatically when all players finish
- **Averages** — ao5 and ao12 calculated per player with proper DNF handling
- **Penalties** — Flag solves as +2 or DNF, even retroactively from the history
- **Full history** — Round-by-round results table with all players
- **Host controls** — Change puzzle, skip scrambles, reset the room, kick players
- **i18n** — English and Spanish
- **Dark theme** — Hot pink accent on dark navy

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Vite |
| UI | MUI 7, Emotion |
| State | MobX |
| Realtime | Socket.IO |
| Scrambles | cubing.js |
| i18n | i18next |
| Hosting | GitHub Pages (frontend), Render (server) |

## Getting Started

### Prerequisites

- Node.js 22+
- Yarn

### Development

```bash
# Install dependencies
yarn install

# Run both client and server
yarn dev
```

This starts:
- Vite dev server on `http://localhost:5173`
- Socket.IO server on `http://localhost:3001`

### Build

```bash
yarn build
```

## Deployment

- **Frontend**: Deployed to GitHub Pages via GitHub Actions on push to `master`
- **Server**: Deployed to Render as a free-tier web service

### Environment

| Variable | Where | Purpose |
|----------|-------|---------|
| `VITE_SOCKET_URL` | GitHub Actions secret | Production server URL |

## Project Structure

```
solve-arena/
├── server/
│   └── index.ts            # Socket.IO server (rooms, scrambles, state sync)
├── src/
│   ├── components/
│   │   ├── room/           # PlayerSidebar, HostControls, ResultsTable
│   │   └── timer/          # Timer, ScrambleDisplay, PuzzleSelector
│   ├── lib/
│   │   ├── stores/         # MobX stores (timer, room, theme, language)
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # formatTime, averages
│   ├── localization/       # i18n (en, es)
│   ├── pages/              # LobbyScreen, RoomScreen
│   ├── routes/             # React Router config
│   └── themes/             # MUI dark/light themes
├── .github/workflows/      # GitHub Actions deploy
└── render.yaml             # Render service config
```

## License

MIT
