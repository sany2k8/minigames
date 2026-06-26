import { useEffect, useRef, useState } from 'react';
import type { GameModule, TableGameProps } from '../../engine/types';
import { botTickMs } from '../../engine/rng';
import { type Board, type Move, N, applyMove, botMove, count, hasMoves, initBoard, isKing, legalMoves, seatOf } from './logic';
import '../games.css';

function CheckersTable({ players, onGameOver }: TableGameProps) {
  const seats = players.slice(0, 2);
  const [board, setBoard] = useState<Board>(initBoard);
  const [turn, setTurn] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const over = useRef(false);

  const cur = seats[turn];
  const moves = legalMoves(board, turn);

  const advance = (nb: Board, justMoved: number) => {
    const next = (justMoved + 1) % 2;
    if (count(nb, next) === 0 || !hasMoves(nb, next)) {
      over.current = true;
      setTimeout(() => onGameOver(seats[justMoved].seat), 500);
    } else setTurn(next);
  };

  const doMove = (m: Move) => {
    const nb = applyMove(board, m);
    setBoard(nb);
    setSel(null);
    advance(nb, turn);
  };
  const doMoveRef = useRef(doMove);
  doMoveRef.current = doMove;

  useEffect(() => {
    if (over.current || cur.kind !== 'bot') return;
    const t = setTimeout(() => {
      const m = botMove(board, turn, cur.difficulty);
      if (m) doMoveRef.current(m);
    }, botTickMs[cur.difficulty] + 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, turn]);

  const selMoves = sel != null ? moves.filter((m) => m.from === sel) : [];
  const destSet = new Set(selMoves.map((m) => m.path[m.path.length - 1]));
  const movableFrom = new Set(moves.map((m) => m.from));

  const tap = (i: number) => {
    if (over.current || cur.kind !== 'human') return;
    if (destSet.has(i)) {
      const m = selMoves.find((x) => x.path[x.path.length - 1] === i)!;
      doMove(m);
      return;
    }
    if (movableFrom.has(i)) setSel(i === sel ? null : i);
  };

  const size = 'min(82cqmin, 84cqh, 460px)';
  return (
    <div className="board">
      <div className="mm-scores">
        {seats.map((p, i) => (
          <div key={p.seat} className={`mm-score ${i === turn ? 'on' : ''}`} style={{ color: p.color }}>
            <span className={`ck-chip ck-${i}`} />
            <span className="mm-name">{p.name}{p.kind === 'bot' ? ' 🤖' : ''}</span>
            <span className="mm-pts">{count(board, i)}</span>
          </div>
        ))}
      </div>
      <div className="ck-board" style={{ width: size, height: size }}>
        {Array.from({ length: N * N }).map((_, i) => {
          const r = Math.floor(i / N);
          const c = i % N;
          const d = (r + c) % 2 === 1;
          const v = board[i];
          const s = seatOf(v);
          return (
            <div
              key={i}
              className={`ck-sq ${d ? 'dark' : 'light'} ${destSet.has(i) ? 'dest' : ''}`}
              onClick={() => tap(i)}
            >
              {v !== 0 && (
                <span className={`ck-piece ck-${s} ${sel === i ? 'sel' : ''}`}>
                  {isKing(v) ? '♚' : ''}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="hint">{cur.name}'s turn{moves.some((m) => m.captured.length) ? ' — capture available!' : ''}</div>
    </div>
  );
}

const mod: GameModule = { contest: 'table', Table: CheckersTable };
export default mod;
