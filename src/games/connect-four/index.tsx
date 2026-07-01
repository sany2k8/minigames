import { useEffect, useRef, useState } from 'react';
import type { GameModule, TableGameProps } from '../../engine/types';
import { makeRng, botTickMs, randomSeed } from '../../engine/rng';
import { sound } from '../../lib/sound';
import { COLS, ROWS, type Board, type Cell, botMove, drop, emptyBoard, isFull, legalCols, smartChance, winner } from './logic';
import '../games.css';

function ConnectFourTable({ players, onGameOver }: TableGameProps) {
  const seats = players.slice(0, 2);
  const botRng = useRef(makeRng(randomSeed())).current;
  const [board, setBoard] = useState<Board>(emptyBoard);
  const [turn, setTurn] = useState(0); // index into seats
  const done = useRef(false);

  const mark = (i: number): 1 | 2 => (i === 0 ? 1 : 2);

  const play = (col: number) => {
    if (done.current) return;
    const res = drop(board, col, mark(turn));
    if (!res) return;
    sound.drop();
    const w = winner(res.board);
    setBoard(res.board);
    if (w) {
      done.current = true;
      onGameOver(seats[turn].seat);
    } else if (isFull(res.board)) {
      done.current = true;
      onGameOver(-1);
    } else {
      setTurn((t) => (t + 1) % 2);
    }
  };
  const playRef = useRef(play);
  playRef.current = play;

  // Bot turn.
  useEffect(() => {
    if (done.current || seats[turn].kind !== 'bot') return;
    const t = setTimeout(() => {
      const col = botMove(board, mark(turn), botRng, smartChance(seats[turn].difficulty));
      if (col >= 0) playRef.current(col);
    }, botTickMs[seats[turn].difficulty] + 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, turn]);

  const cur = seats[turn];
  const humanTurn = !done.current && cur.kind === 'human';
  const canDrop = humanTurn ? legalCols(board) : [];
  const size = 'min(92cqmin, 70cqh, 460px)';

  const disc = (v: Cell) => (v === 0 ? '' : v === 1 ? 'a' : 'b');

  return (
    <div className="board c4">
      <div className="board-info">
        <span style={{ color: seats[0].color }}>● {seats[0].name}</span>
        <span>{done.current ? 'Game over' : `${cur.name}'s turn`}</span>
        <span style={{ color: seats[1].color }}>{seats[1].name} ●</span>
      </div>
      <div
        className="c4-board"
        style={{ width: size, gridTemplateColumns: `repeat(${COLS}, 1fr)`, ['--p1' as string]: seats[0].color, ['--p2' as string]: seats[1].color }}
      >
        {Array.from({ length: COLS }).map((_, c) => (
          <button
            key={c}
            className="c4-col"
            onClick={() => humanTurn && canDrop.includes(c) && play(c)}
            disabled={!humanTurn || !canDrop.includes(c)}
            aria-label={`drop column ${c + 1}`}
          >
            {Array.from({ length: ROWS }).map((_, r) => {
              const v = board[r * COLS + c];
              return <span key={r} className={`c4-cell ${disc(v)}`} />;
            })}
          </button>
        ))}
      </div>
      <div className="hint">{done.current ? 'Tap rematch to play again' : 'Drop a disc — line up four to win'}</div>
    </div>
  );
}

const mod: GameModule = { contest: 'table', Table: ConnectFourTable };
export default mod;
