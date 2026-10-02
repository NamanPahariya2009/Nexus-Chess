import { DragEvent, useEffect, useMemo, useState } from 'react'
import { Chess, Move, Square } from 'chess.js'
import { getBotMove, BotLevel } from './botIntegration'
import { capturedPieces, GameMode, isGameOver, makeMove, PlayerColor, START_FEN, statusOf } from './gameLogic'
import { createRoom, createSocket } from './socketHandlers'
import { Piece } from './Piece'
import type { Socket } from 'socket.io-client'

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const ranks = [8, 7, 6, 5, 4, 3, 2, 1]

function App() {
  const [chess, setChess] = useState(() => new Chess())
  const [mode, setMode] = useState<GameMode>('training')
  const [level, setLevel] = useState<BotLevel>('operator')
  const [selected, setSelected] = useState<string | null>(null)
  const [roomCode, setRoomCode] = useState('')
  const [activeRoom, setActiveRoom] = useState('')
  const [color, setColor] = useState<PlayerColor>('white')
  const [notice, setNotice] = useState('SYSTEM READY')
  const [thinking, setThinking] = useState(false)
  const [resigned, setResigned] = useState(false)
  const [gameVersion, refresh] = useState(0)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [socketState, setSocketState] = useState<'offline' | 'connecting' | 'online'>('offline')

  const history = chess.history({ verbose: true })
  const legalTargets = useMemo(() => selected ? chess.moves({ square: selected as Square, verbose: true }).map((move) => move.to) : [], [chess, selected])
  const captures = capturedPieces(history)
  const status = resigned ? 'resigned' : statusOf(chess)
  const boardFiles = color === 'black' ? [...files].reverse() : files
  const boardRanks = color === 'black' ? [...ranks].reverse() : ranks
  const checkedKingSquare = status === 'check' || status === 'checkmate'
    ? files.flatMap((file) => ranks.map((rank) => `${file}${rank}`)).find((square) => {
      const piece = chess.get(square as Square)
      return piece?.type === 'k' && piece.color === chess.turn()
    })
    : null

  useEffect(() => {
    if (mode !== 'network') return
    setSocketState('connecting')
    const connection = createSocket({
      onConnect: () => { setSocketState('online'); setNotice('NETWORK LINK ONLINE') },
      onError: () => { setSocketState('offline'); setNotice('NETWORK LINK OFFLINE // START SERVER') },
      onMove: ({ fen }) => { chess.load(fen); setSelected(null); refresh((value) => value + 1); setNotice('REMOTE MOVE RECEIVED') },
      onReset: (fen) => { chess.load(fen); setResigned(false); setSelected(null); refresh((value) => value + 1); setNotice('BOARD RESET') },
      onResign: () => { setResigned(true); setSelected(null); setNotice('OPPONENT RESIGNED // MATCH ENDED') },
      onReady: () => setNotice('LINK ESTABLISHED // OPPONENT CONNECTED'),
      onOpponentLeft: () => setNotice('OPPONENT DISCONNECTED'),
    })
    setSocket(connection)
    return () => { connection.disconnect(); setSocket(null); setSocketState('offline') }
  }, [mode])

  useEffect(() => {
    if (mode !== 'training' || chess.turn() !== 'b' || isGameOver(status)) return
    setThinking(true)
    getBotMove(chess, level).then((move) => {
      if (move) makeMove(chess, move.from, move.to)
      setThinking(false); refresh((value) => value + 1)
    })
  }, [chess, gameVersion, level, mode, status])

  function commitMove(from: string, to: string) {
    if (thinking || isGameOver(status) || (mode === 'training' && chess.turn() === 'b') || (mode === 'network' && chess.turn() !== (color === 'white' ? 'w' : 'b'))) return
    const move = makeMove(chess, from, to)
    if (!move) return
    refresh((value) => value + 1)
    setNotice(`MOVE LOGGED // ${move.san}`)
    setSelected(null)
    if (mode === 'network' && activeRoom) socket?.emit('game:move', { code: activeRoom, fen: chess.fen(), move: { san: move.san, from: move.from, to: move.to } })
  }

  function handleSquare(square: string) {
    if (thinking || isGameOver(status) || (mode === 'training' && chess.turn() === 'b') || (mode === 'network' && chess.turn() !== (color === 'white' ? 'w' : 'b'))) return
    if (selected && legalTargets.includes(square as Square)) {
      commitMove(selected, square)
      return
    }
    const piece = chess.get(square as Square)
    if (piece && piece.color === chess.turn()) setSelected(square)
    else setSelected(null)
  }

  function handleDragStart(square: string, event: DragEvent<HTMLButtonElement>) {
    if (thinking || isGameOver(status) || (mode === 'training' && chess.turn() === 'b') || (mode === 'network' && chess.turn() !== (color === 'white' ? 'w' : 'b'))) {
      event.preventDefault()
      return
    }
    setSelected(square)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', square)
  }

  function handleDrop(square: string, event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    const from = event.dataTransfer.getData('text/plain')
    if (from && legalTargets.includes(square as Square)) commitMove(from, square)
  }

  function resetGame() {
    chess.load(START_FEN); setResigned(false); setSelected(null); setThinking(false); refresh((value) => value + 1); setNotice('BOARD RESET // READY')
    if (mode === 'network' && activeRoom) socket?.emit('game:reset', { code: activeRoom, fen: START_FEN })
  }

  function resignGame() {
    setResigned(true)
    setSelected(null)
    setNotice('LOCAL PLAYER RESIGNED // MATCH ENDED')
    if (mode === 'network' && activeRoom) socket?.emit('game:resign', { code: activeRoom })
  }

  function createNetworkRoom() { if (socketState !== 'online' || !socket) return setNotice('NETWORK LINK OFFLINE // RETRYING'); createRoom(socket, (result) => { if (result.error) return setNotice(result.error.toUpperCase()); if (result.code) { setActiveRoom(result.code); setColor('white'); setNotice(`ROOM ${result.code} // AWAITING OPPONENT`) } }) }
  function joinNetworkRoom() { const code = roomCode.trim().toUpperCase(); if (socketState !== 'online' || !socket) return setNotice('NETWORK LINK OFFLINE // RETRYING'); if (!code) return setNotice('ENTER A ROOM CODE'); socket.timeout(5000).emit('room:join', { code }, (timeout: Error | null, result: { code?: string; color?: PlayerColor; fen?: string; error?: string }) => { if (timeout) return setNotice('ROOM SERVICE TIMEOUT. CHECK THE SERVER LINK.'); if (result.error) return setNotice(result.error.toUpperCase()); if (result.code && result.color) { setActiveRoom(result.code); setColor(result.color); if (result.fen) { chess.load(result.fen); refresh((value) => value + 1) }; setNotice(`ROOM ${result.code} // LINKED AS ${result.color.toUpperCase()}`) } }) }

  return <main className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">N</span><span>NEXUS<span className="muted">/</span>CHESS</span></div><div className="connection"><span className="status-dot" /> {mode === 'network' && activeRoom ? `ROOM ${activeRoom}` : mode === 'network' ? `NETWORK ${socketState.toUpperCase()}` : 'LOCAL INSTANCE'} <span className="version">V.1.0.0</span></div></header>
    <section className="workspace">
      <aside className="rail"><button className={mode === 'training' ? 'rail-button active' : 'rail-button'} onClick={() => setMode('training')}><span>01</span>TRAINING</button><button className={mode === 'network' ? 'rail-button active' : 'rail-button'} onClick={() => setMode('network')}><span>02</span>NETWORK</button><div className="rail-foot">NXS<br />OPS</div></aside>
      <section className="game-area"><div className="mode-heading"><div><span className="eyebrow">ACTIVE PROTOCOL</span><h1>{mode === 'training' ? 'TRAINING DECK' : 'NETWORK ARENA'}</h1></div><div className="turn-readout"><span className="eyebrow">TURN</span><strong>{thinking ? 'COMPUTING' : chess.turn() === 'w' ? 'WHITE' : 'BLACK'}</strong></div></div>
        {mode === 'network' && <div className="network-strip"><span>ROOM ACCESS</span><input value={roomCode} onChange={(event) => setRoomCode(event.target.value)} placeholder="ENTER CODE" maxLength={6} /><button onClick={joinNetworkRoom}>JOIN</button><button className="outline" onClick={createNetworkRoom}>NEW ROOM</button></div>}
        <div className="board-wrap"><div className="board-coordinates files">{boardFiles.map((file) => <span key={file}>{file}</span>)}</div><div className="board-row"><div className="board-coordinates ranks">{boardRanks.map((rank) => <span key={rank}>{rank}</span>)}</div><div className={`board ${status === 'check' ? 'check-alert' : ''} ${status === 'checkmate' ? 'checkmate-alert' : ''} ${status === 'resigned' ? 'resign-alert' : ''}`}>{boardRanks.flatMap((rank, row) => boardFiles.map((file, column) => { const square = `${file}${rank}`; const piece = chess.get(square as Square); const isSelected = selected === square; const isTarget = legalTargets.includes(square as Square); const isCheckedKing = checkedKingSquare === square; return <button key={square} draggable={Boolean(piece)} className={`square ${(row + column) % 2 ? 'dark' : 'light'} ${isSelected ? 'selected' : ''} ${isTarget ? 'target' : ''} ${isCheckedKing ? 'king-in-check' : ''}`} onClick={() => handleSquare(square)} onDragStart={(event) => handleDragStart(square, event)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(square, event)}>{piece && <Piece type={piece.type} color={piece.color} />}{isTarget && !piece && <i />}</button> }))}</div></div></div>
        <div className="board-status"><span><span className="status-dot" /> {status === 'check' ? 'CHECK DETECTED // RESPOND' : status === 'checkmate' ? 'CHECKMATE // MATCH ENDED' : status === 'resigned' ? notice : notice}</span><span>{status === 'playing' ? 'LIVE' : status.toUpperCase()} // {history.length} PLIES</span></div>
      </section>
      <aside className="control-panel"><section className="panel-block"><span className="eyebrow">OPPONENT PROFILE</span><div className="profile"><div className="avatar">{mode === 'training' ? 'AI' : color === 'white' ? 'W' : 'B'}</div><div><strong>{mode === 'training' ? 'STOCKFISH CORE' : `REMOTE ${color === 'white' ? 'WHITE' : 'BLACK'}`}</strong><small>{mode === 'training' ? 'LOCAL COMPUTATION' : activeRoom ? 'SOCKET LINK ACTIVE' : 'ROOM NOT CONNECTED'}</small></div></div>{mode === 'training' && <div className="level-control"><label>DIFFICULTY <b>{level.toUpperCase()}</b></label><div className="level-buttons">{(['rookie', 'operator', 'grandmaster'] as BotLevel[]).map((item) => <button key={item} className={level === item ? 'chosen' : ''} onClick={() => setLevel(item)}>{item === 'rookie' ? '01' : item === 'operator' ? '02' : '03'}</button>)}</div></div>}</section><section className="panel-block capture-block"><span className="eyebrow">MATERIAL DELTA</span><div className="capture-line"><span>WHITE <b>{captures.white.join(' ') || '—'}</b></span><span>BLACK <b>{captures.black.join(' ') || '—'}</b></span></div></section><section className="panel-block history-block"><div className="section-title"><span className="eyebrow">TRANSMISSION LOG</span><span>{history.length.toString().padStart(2, '0')}</span></div><div className="history-list">{history.length === 0 ? <p>NO MOVEMENTS RECORDED</p> : history.map((move, index) => <div key={`${move.san}-${index}`}><span>{String(Math.floor(index / 2) + 1).padStart(2, '0')} {index % 2 ? 'B' : 'W'}</span><b>{move.san}</b></div>)}</div></section><div className="panel-actions"><button onClick={resetGame}>RESET BOARD</button><button className={`danger ${status === 'resigned' ? 'resigned' : ''}`} onClick={resignGame}>RESIGN MATCH</button></div></aside>
    </section>
    <footer><span>ENCRYPTED LOCAL SESSION</span><span>LATENCY &lt; 12MS</span><span>BUILD 2026.10</span></footer>
  </main>
}

export default App
