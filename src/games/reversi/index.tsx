import { useEffect, useRef, useState } from 'react';
import type { GameModule, TableGameProps } from '../../engine/types';
import { botTickMs } from '../../engine/rng';
import { type Board, SIZE, applyMove, botMove, count, flips, initBoard, validMoves } from './logic';
import '../games.css';

function ReversiTable({ players, onGameOver }: TableGameProps) {
  const seats = players.slice(0, 2);
  const [board, setBoard] = useState<Board>(initBoard);
  const [turn, setTurn] = useState(0);
  const over = useRef(false);

  const cur = seats[turn];
  const moves = validMoves(board, turn);

  const advance = (nb: Board, justMoved: number) => {
    const nextSeat = (justMoved + 1) % 2;
    const nextHas = validMoves(nb, nextSeat).length > 0;
    const curHas = validMoves(nb, justMoved).length > 0;
    if (nextHas) setTurn(nextSeat);
    else if (curHas) setTurn(justMoved); // opponent passes
    else {
      // game over
      over.current = true;
      const a = count(nb, 0);
      const b = count(nb, 1);
      setTimeout(() => onGameOver(a === b ? -1 : seats[a > b ? 0 : 1].seat), 500);
    }
  };

  const play = (cell: number) => {
    if (over.current || flips(board, turn, Math.floor(cell / SIZE), cell % SIZE).length === 0) return;
    const nb = applyMove(board, turn, cell);
    setBoard(nb);
    advance(nb, turn);
  };
  const playRef = useRef(play);
  playRef.current = play;

  useEffect(() => {
    if (over.current || cur.kind !== 'bot') return;
    const t = setTimeout(() => {
      const m = botMove(board, turn, cur.difficulty);
      if (m >= 0) playRef.current(m);
    }, botTickMs[cur.difficulty]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, turn]);

  const size = 'min(82cqmin, 84cqh, 460px)';
  const validSet = new Set(cur.kind === 'human' ? moves : []);
  return (
    <div className="board">
      <div className="mm-scores">
        {seats.map((p, i) => (
          <div key={p.seat} className={`mm-score ${i === turn ? 'on' : ''}`} style={{ color: p.color }}>
            <span className={`rv-chip rv-${i}`} />
            <span className="mm-name">{p.name}{p.kind === 'bot' ? ' 🤖' : ''}</span>
            <span className="mm-pts">{count(board, i)}</span>
          </div>
        ))}
      </div>
      <div className="rv-board" style={{ width: size, height: size, gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
        {Array.from({ length: SIZE * SIZE }).map((_, i) => {
          const v = board[i];
          return (
            <div key={i} className="rv-cell" onClick={() => cur.kind === 'human' && play(i)}>
              {v >= 0 && <span className={`rv-chip rv-${v}`} />}
              {v < 0 && validSet.has(i) && <span className="rv-hint" />}
            </div>
          );
        })}
      </div>
      <div className="hint">{cur.name}'s turn ({turn === 0 ? '⚫' : '⚪'})</div>
    </div>
  );
}

const mod: GameModule = { contest: 'table', Table: ReversiTable };
export default mod;
