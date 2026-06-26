import { useEffect, useRef, useState } from 'react';
import type { GameModule, TableGameProps } from '../../engine/types';
import { type Board, botMove, emptyBoard, winner } from './logic';
import '../games.css';

const MARK = ['✕', '◯'];

function TicTacToeTable({ players, onGameOver }: TableGameProps) {
  const seats = players.slice(0, 2);
  const [board, setBoard] = useState<Board>(emptyBoard());
  const [turn, setTurn] = useState(0); // index into seats
  const over = useRef(false);

  const cur = seats[turn];
  const result = winner(board);

  const play = (i: number) => {
    if (over.current || board[i] !== -1 || result) return;
    setBoard((b) => {
      const nb = b.slice();
      nb[i] = turn as 0 | 1;
      return nb;
    });
    setTurn((t) => (t + 1) % 2);
  };
  const playRef = useRef(play);
  playRef.current = play;

  // resolve end
  useEffect(() => {
    if (over.current) return;
    if (result === 'draw') {
      over.current = true;
      setTimeout(() => onGameOver(-1), 500);
    } else if (result === 0 || result === 1) {
      over.current = true;
      setTimeout(() => onGameOver(seats[result].seat), 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  // bot move
  useEffect(() => {
    if (over.current || result || cur.kind !== 'bot') return;
    const t = setTimeout(() => {
      const mv = botMove(board, turn as 0 | 1, cur.difficulty);
      if (mv >= 0) playRef.current(mv);
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, turn, result]);

  const size = 'min(74cqmin, 80cqh, 380px)';
  return (
    <div className="board">
      <div className="ttt-turn">
        {seats.map((p, i) => (
          <div key={p.seat} className={`ttt-player ${i === turn && !result ? 'on' : ''}`} style={{ color: p.color }}>
            <span className="ttt-mark">{MARK[i]}</span>
            <span>{p.name}{p.kind === 'bot' ? ' 🤖' : ''}</span>
          </div>
        ))}
      </div>
      <div className="ttt-grid" style={{ width: size, height: size }}>
        {board.map((v, i) => (
          <button
            key={i}
            className="ttt-cell"
            onClick={() => cur.kind === 'human' && play(i)}
            style={{ color: v >= 0 ? seats[v].color : undefined }}
          >
            {v >= 0 ? MARK[v] : ''}
          </button>
        ))}
      </div>
      <div className="hint">
        {result ? (result === 'draw' ? 'Draw!' : `${seats[result].name} wins!`) : `${cur.name}'s turn`}
      </div>
    </div>
  );
}

const mod: GameModule = { contest: 'table', Table: TicTacToeTable };
export default mod;
