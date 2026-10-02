import { Chess, Move, Square } from 'chess.js'

export const START_FEN = new Chess().fen()
export type GameMode = 'training' | 'network'
export type PlayerColor = 'white' | 'black'
export type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw' | 'resigned'

export function isGameOver(status: GameStatus) {
  return status === 'checkmate' || status === 'stalemate' || status === 'draw' || status === 'resigned'
}

export function statusOf(chess: Chess): GameStatus {
  if (chess.isCheckmate()) return 'checkmate'
  if (chess.isStalemate()) return 'stalemate'
  if (chess.isDraw()) return 'draw'
  if (chess.inCheck()) return 'check'
  return 'playing'
}

export function makeMove(chess: Chess, from: string, to: string): Move | null {
  try {
    return chess.move({ from: from as Square, to: to as Square, promotion: 'q' })
  } catch {
    return null
  }
}

export function capturedPieces(history: Move[]) {
  const captured: { white: string[]; black: string[] } = { white: [], black: [] }
  for (const move of history) {
    if (move.captured) captured[move.color === 'w' ? 'black' : 'white'].push(move.captured)
  }
  return captured
}
