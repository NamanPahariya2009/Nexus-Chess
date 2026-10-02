import { io, Socket } from 'socket.io-client'
import { START_FEN } from './gameLogic'

export type NetworkEvents = {
  onConnect: () => void
  onError: () => void
  onMove: (payload: { fen: string; move: { san: string; from: string; to: string } }) => void
  onReset: (fen: string) => void
  onResign: () => void
  onReady: (fen: string) => void
  onOpponentLeft: () => void
}

export function createSocket(events: NetworkEvents) {
  const socket: Socket = io(window.location.origin, { transports: ['websocket', 'polling'] })
  socket.on('connect', events.onConnect)
  socket.on('connect_error', events.onError)
  socket.on('game:move', events.onMove)
  socket.on('game:reset', ({ fen }) => events.onReset(fen))
  socket.on('game:resign', events.onResign)
  socket.on('room:ready', events.onReady)
  socket.on('room:opponent-left', events.onOpponentLeft)
  return socket
}

export function createRoom(socket: Socket, callback: (result: { code?: string; color?: 'white' | 'black'; error?: string }) => void) {
  socket.timeout(5000).emit('room:create', { fen: START_FEN }, (error: Error | null, result: { code?: string; color?: 'white' | 'black'; error?: string }) => {
    callback(error ? { error: 'ROOM SERVICE TIMEOUT. CHECK THE SERVER LINK.' } : result)
  })
}
