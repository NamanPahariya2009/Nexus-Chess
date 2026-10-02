import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: true, credentials: true } })
const rooms = new Map<string, { fen: string; players: Map<string, 'white' | 'black'> }>()
const port = Number(process.env.PORT ?? 3000)

app.get('/health', (_req, res) => res.json({ status: 'online', rooms: rooms.size }))

io.on('connection', (socket) => {
  socket.on('room:create', ({ fen }, callback) => {
    const code = randomBytes(3).toString('hex').toUpperCase()
    rooms.set(code, { fen, players: new Map([[socket.id, 'white']]) })
    socket.join(code)
    callback({ code, color: 'white' })
  })

  socket.on('room:join', ({ code }, callback) => {
    const room = rooms.get(code.toUpperCase())
    if (!room) return callback({ error: 'Room not found.' })
    if (room.players.size >= 2) return callback({ error: 'Room is occupied.' })
    room.players.set(socket.id, 'black')
    socket.join(code.toUpperCase())
    callback({ code: code.toUpperCase(), color: 'black', fen: room.fen })
    io.to(code.toUpperCase()).emit('room:ready', { fen: room.fen })
  })

  socket.on('game:move', ({ code, fen, move }) => {
    const room = rooms.get(code)
    if (!room || !room.players.has(socket.id)) return
    room.fen = fen
    socket.to(code).emit('game:move', { fen, move })
  })

  socket.on('game:reset', ({ code, fen }) => {
    const room = rooms.get(code)
    if (!room || !room.players.has(socket.id)) return
    room.fen = fen
    io.to(code).emit('game:reset', { fen })
  })

  socket.on('game:resign', ({ code }) => socket.to(code).emit('game:resign'))
  socket.on('disconnect', () => {
    for (const [code, room] of rooms) {
      if (room.players.delete(socket.id)) {
        socket.to(code).emit('room:opponent-left')
        if (room.players.size === 0) rooms.delete(code)
      }
    }
  })
})

const clientDist = join(process.cwd(), 'dist')
if (existsSync(clientDist)) {
  app.use(express.static(clientDist))
  app.get('*', (_req, res) => res.sendFile(join(clientDist, 'index.html')))
}

httpServer.listen(port, '0.0.0.0', () => console.log(`NEXUS CHESS listening on 0.0.0.0:${port}`))
