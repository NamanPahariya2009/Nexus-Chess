import { PieceSymbol } from 'chess.js'

export function Piece({ type, color }: { type: PieceSymbol; color: 'w' | 'b' }) {
  const base = <><path d="M14 91c3-5 11-8 20-10h32c9 2 17 5 20 10-7 4-65 4-72 0Z" /><path d="M25 81c2-5 7-8 12-10h26c5 2 10 5 12 10-12 3-38 3-50 0Z" /></>
  const shape = {
    k: <><path d="M50 8v21M39 18h22" /><path d="M38 34c0 8-10 13-12 28h48C72 47 62 42 62 34H38Z" /><path d="M31 62h38l4 9H27l4-9Z" />{base}</>,
    q: <><path d="M22 20l11 11 17-20 17 20 11-11-7 43H29l-7-43Z" /><circle cx="22" cy="20" r="4" /><circle cx="50" cy="11" r="4" /><circle cx="78" cy="20" r="4" /><path d="M28 63h44l4 8H24l4-8Z" />{base}</>,
    r: <><path d="M22 15h13v12h9V15h12v12h9V15h13v23l-9 8v17H30V46l-8-8V15Z" /><path d="M30 63h40l4 8H26l4-8Z" />{base}</>,
    b: <><path d="M50 10c-8 4-12 11-10 18 2 7 8 9 6 15-2 6-11 11-14 23h36c-3-12-12-17-14-23-2-6 4-8 6-15 2-7-2-14-10-18Z" /><path d="M59 16 41 48" fill="none" strokeWidth="4" /><path d="M31 63h38l4 8H27l4-8Z" />{base}</>,
    n: <><path d="M30 69c1-11 8-18 18-23-6-7-8-15-5-23l8-13 8 10 11-3-4 12 10 8 6 11-12 5 2 16H30Z" /><path d="M52 20l6 9 8-2M66 31l9 3M43 27l-5 7 8 3" fill="none" strokeWidth="3" /><circle cx="67" cy="29" r="2.5" />{base}</>,
    p: <><circle cx="50" cy="25" r="14" /><path d="M40 37c2 8-11 17-13 30-1 6-5 10-11 14h68c-6-4-10-8-11-14-2-13-15-22-13-30-6 4-14 4-20 0Z" />{base}</>,
  }[type]
  const materialId = `piece-${color}-material`
  return <svg className={`piece piece-${color}`} viewBox="0 0 100 100" role="img" aria-label={`${color === 'w' ? 'white' : 'black'} ${type}`}><defs><linearGradient id={materialId} x1="0" y1="0" x2="0.85" y2="1"><stop offset="0" stopColor={color === 'w' ? '#ffffff' : '#989898'} /><stop offset="0.5" stopColor={color === 'w' ? '#e3e4e1' : '#686868'} /><stop offset="1" stopColor={color === 'w' ? '#adb1ae' : '#373838'} /></linearGradient></defs><g fill={`url(#${materialId})`} stroke={color === 'w' ? '#626765' : '#242525'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{shape}</g></svg>
}
