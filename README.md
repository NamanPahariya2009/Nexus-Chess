# Nexus Chess

> A focused, real-time chess board for local training and long-distance matches.

[![CI](https://github.com/NamanPahariya2009/Nexus-Chess/actions/workflows/ci.yml/badge.svg)](https://github.com/NamanPahariya2009/Nexus-Chess/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-00e5ff.svg)](LICENSE)

Nexus Chess is a browser chess experience with a stark control-room interface, validated moves, animated game states, and room-based multiplayer. Play against the local training opponent or invite a friend with a short room code.

## What Is Included

### Training

- Adjustable opponent profiles
- Responsive local move selection
- Legal move validation through `chess.js`

### Network

- Create or join a room with a six-character code
- Low-latency Socket.io synchronization
- Automatic Black-side board rotation
- Opponent disconnect and resignation feedback

### Board Experience

- Click or drag-and-drop movement
- Move history and captured material
- Check, checkmate, and resignation animations
- Reference-inspired grayscale pieces and textured board
- Reset and resign controls

## Quick Start

### Requirements

- Node.js 20+
- npm

### Development

```powershell
git clone https://github.com/NamanPahariya2009/Nexus-Chess.git
cd Nexus-Chess
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Vite serves the client on port `5173` and proxies Socket.io traffic to the Express server on port `3000`.

### Production

```powershell
npm install
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000).

The Express server binds to `0.0.0.0` and serves the compiled client and Socket.io from the same port.

## Play With A Friend

For a quick remote match, expose the production server with a WebSocket-compatible tunnel:

```powershell
npm run build
npm run start
ngrok http 3000
```

Share the generated HTTPS URL. Both players open it, choose **Network**, and one player creates a room. The second player joins with the displayed code.

For permanent hosting, use a Node.js service that supports WebSockets:

```text
Build command: npm install && npm run build
Start command: npm run start
```

The server reads the platform-provided `PORT` variable and binds to `0.0.0.0` automatically.

## Verify Changes

```powershell
npm run build
npm run typecheck:server
```

GitHub Actions runs both checks on pushes and pull requests.

## Architecture

```text
server/index.ts          Express server and Socket.io room lifecycle
src/App.tsx              Main board, modes, controls, and game flow
src/gameLogic.ts         Chess state, status, and material helpers
src/botIntegration.ts    Training opponent integration boundary
src/socketHandlers.ts    Client-side multiplayer events
src/Piece.tsx            Inline SVG piece renderer
src/*.css                Board skin, responsive UI, and animations
```

## License

Released under the [MIT License](LICENSE).
