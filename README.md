# Nexus Chess

A real-time browser chess game with local training and room-based multiplayer.

## Features

- Training mode with adjustable local opponent difficulty
- Network mode with shareable room codes via Socket.io
- Drag-and-drop and click-to-move controls
- Move history, captured material, reset, resign, check, and checkmate feedback
- Black-player board rotation
- Express serves the production Vite build and Socket.io from one port

## Requirements

- Node.js 20 or newer
- npm

## Run Locally

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`.

The development client runs on port `5173` and proxies Socket.io traffic to the Express server on port `3000`.

## Production Run

```powershell
npm install
npm run build
npm run start
```

Open `http://localhost:3000`.

The server binds to `0.0.0.0`, so it can be reached from another device on the same network using your computer's LAN IP.

## Remote Multiplayer

For a quick internet test, start the production server and expose port `3000` through a tunnel such as ngrok:

```powershell
npm run build
npm run start
ngrok http 3000
```

Share the generated HTTPS URL with your friend. Both players open the URL, select **Network**, and use the room code created by one player.

For a permanent public deployment, use a Node host that supports WebSockets and runs:

```text
Build command: npm install && npm run build
Start command: npm run start
```

Set the service port from the platform's `PORT` environment variable. The server already reads `PORT` and binds to `0.0.0.0`.

## Checks

```powershell
npm run build
npx tsc -p tsconfig.server.json --noEmit
```

## Project Layout

```text
server/index.ts          Express and Socket.io room server
src/App.tsx              Main game interface and interaction flow
src/gameLogic.ts         Chess state helpers and status handling
src/botIntegration.ts    Training opponent integration boundary
src/socketHandlers.ts    Browser Socket.io event wiring
src/Piece.tsx            SVG chess piece renderer
src/*.css                UI, board, animation, and piece styling
```
