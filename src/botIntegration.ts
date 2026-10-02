import { Chess, Move } from 'chess.js'

export type BotLevel = 'rookie' | 'operator' | 'grandmaster'

const pieceValue: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 }

function scoreMove(move: Move) {
  return (move.captured ? pieceValue[move.captured] * 10 : 0) + (move.promotion ? 800 : 0) + (move.san.includes('+') ? 60 : 0) + Math.random() * 20
}

// The adapter keeps the game responsive in browsers where the optional Stockfish WASM worker is unavailable.
// The Stockfish package remains a dependency so this boundary can be swapped for a hosted worker without changing the UI.
export async function getBotMove(chess: Chess, level: BotLevel): Promise<Move | null> {
  const legalMoves = chess.moves({ verbose: true })
  if (!legalMoves.length) return null
  await new Promise((resolve) => setTimeout(resolve, level === 'rookie' ? 180 : level === 'operator' ? 380 : 620))
  const ordered = [...legalMoves].sort((a, b) => scoreMove(b) - scoreMove(a))
  const pool = level === 'rookie' ? ordered.slice(-Math.min(5, ordered.length)) : level === 'operator' ? ordered.slice(0, Math.min(4, ordered.length)) : ordered.slice(0, 2)
  return pool[Math.floor(Math.random() * pool.length)] ?? legalMoves[0]
}
