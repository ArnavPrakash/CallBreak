# Callbreak Multiplayer

Full-stack Callbreak card game with React, Express, Socket.IO, and MongoDB.

## Structure

- `packages/shared` — Shared TypeScript types and socket event definitions
- `backend` — Express API, Socket.IO server, game engine
- `frontend` — Vite + React + Tailwind UI

## Setup

1. Copy `.env.example` to `.env` and set `MONGODB_URI` (MongoDB Atlas or local).
2. Install dependencies:

```bash
npm install
```

3. Run development (backend on :5000, frontend on :5173):

```bash
npm run dev
```

4. Production build and start:

```bash
npm run build
npm start
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run backend + frontend concurrently |
| `npm run build` | Build shared, frontend, and backend |
| `npm start` | Production server (serves frontend + API + WebSocket) |

## API

- `GET /health` — Health check (200 OK)
- `GET /api/history?player=<username>` — Match history and stats

## Deploy on Render

Use the included `render.yaml` or create a Web Service with:

- **Build:** `npm install && npm run build`
- **Start:** `npm start`
- **Env:** `MONGODB_URI`, `NODE_ENV=production`

## How to play

1. Open the app, enter a username.
2. Create a room or join with a 4-character code.
3. When 4 players are in the lobby, the host starts the game.
4. Bid tricks (1–13), then play cards following suit/trump rules.
5. After 5 rounds, the highest total score wins; the match is saved to MongoDB.
