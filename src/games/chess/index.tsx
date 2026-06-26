import { useEffect, useRef, useState } from 'react';
import type { GameModule, TableGameProps } from '../../engine/types';
import { botTickMs } from '../../engine/rng';
import { HowToPlay } from '../HowToPlay';
import { ChessIcon } from '../icons';
import {
  type ChessState,
  type Move,
  applyMove,
  bestMove,
  initState,
  inCheck,
  kingSquare,
  legalMoves,
  seatOf,
  status,
  typeOf
} from './logic';
import '../games.css';

const GLYPH = ['', '♟', '♞', '♝', '♜', '♛', '♚']; // indexed by piece type

function ChessTable({ players, onGameOver }: TableGameProps) {
  const seats = players.slice(0, 2);
  const [state, setState] = useState<ChessState>(initState);
  const [sel, setSel] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const over = useRef(false);

  const cur = seats[state.turn];
  const moves = legalMoves(state);
  const checkSq = inCheck(state, state.turn) ? kingSquare(state.board, state.turn) : -1;

  const doMove = (m: Move) => {
    const ns = applyAndSettle(m);
    setState(ns);
    setSel(null);
  };
  const doMoveRef = useRef(doMove);
  doMoveRef.current = doMove;

  // resolve a move and schedule game-over if it ends the game
  function applyAndSettle(m: Move): ChessState {
    const moverSeat = state.turn;
    const ns = applyMove(state, m);
    const st = status(ns);
    if (st !== 'playing') {
      over.current = true;
      setTimeout(() => onGameOver(st === 'checkmate' ? seats[moverSeat].seat : -1), 600);
    }
    return ns;
  }

  useEffect(() => {
    if (!ready || over.current || cur.kind !== 'bot') return;
    const t = setTimeout(() => {
      const m = bestMove(state, cur.difficulty);
      if (m) doMoveRef.current(m);
    }, botTickMs[cur.difficulty] + 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, cur.kind, ready]);

  const selMoves = sel != null ? moves.filter((m) => m.from === sel) : [];
  const destSet = new Set(selMoves.map((m) => m.to));
  const movableFrom = new Set(moves.map((m) => m.from));

  const tap = (i: number) => {
    if (!ready || over.current || cur.kind !== 'human') return;
    if (destSet.has(i)) {
      doMove(selMoves.find((m) => m.to === i)!);
      return;
    }
    if (movableFrom.has(i)) setSel(i === sel ? null : i);
    else setSel(null);
  };

  const size = 'min(82cqmin, 84cqh, 460px)';
  const checkTxt = checkSq >= 0 ? ' — check!' : '';

  return (
    <div className="board">
      <div className="mm-scores">
        {seats.map((p, i) => (
          <div key={p.seat} className={`mm-score ${i === state.turn ? 'on' : ''}`} style={{ color: p.color }}>
            <span className={`cb-chip cb-${i}`} />
            <span className="mm-name">{p.name}{p.kind === 'bot' ? ' 🤖' : ''}</span>
          </div>
        ))}
      </div>
      <div className="cb-board" style={{ width: size, height: size }}>
        {Array.from({ length: 64 }).map((_, i) => {
          const r = i >> 3;
          const c = i & 7;
          const light = (r + c) % 2 === 0;
          const v = state.board[i];
          const s = seatOf(v);
          return (
            <div
              key={i}
              className={`cb-sq ${light ? 'light' : 'dark'} ${destSet.has(i) ? 'dest' : ''} ${i === checkSq ? 'check' : ''}`}
              onClick={() => tap(i)}
            >
              {destSet.has(i) && <span className={`cb-dot ${v !== 0 ? 'cap' : ''}`} />}
              {v !== 0 && (
                <span className={`cb-piece cb-${s} ${sel === i ? 'sel' : ''}`}>{GLYPH[typeOf(v)]}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="hint">
        {over.current ? 'Game over' : `${cur.name}'s move${checkTxt}`}
      </div>
      {!ready && (
        <HowToPlay
          title="Chess"
          tagline="White moves first."
          icon={<ChessIcon />}
          accent="#8a9bb8"
          accent2="#1d2c3a"
          cta="Start Game"
          onStart={() => setReady(true)}
          steps={[
            { icon: '♟️', text: 'Tap one of your pieces to light up its legal moves, then tap a highlighted square to move there.' },
            { icon: '♛', text: 'A pawn reaching the far side promotes to a Queen automatically.' },
            { icon: '👑', text: 'Trap the enemy King with no escape — checkmate — to win the game.' }
          ]}
        />
      )}
    </div>
  );
}

const mod: GameModule = { contest: 'table', Table: ChessTable };
export default mod;
