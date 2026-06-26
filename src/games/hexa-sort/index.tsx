import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import { type Board, type Cell, COLS, HEX_COLORS, ROWS, botMove, emptyBoard, hasEmpty, makePiece, place } from './logic';
import '../games.css';

function HexaSortSolo({ seed, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const rng = useRef(makeRng(seed)).current;
  const [board, setBoard] = useState<Board>(emptyBoard);
  const [piece, setPiece] = useState<Cell>(() => makePiece(rng));
  const [next, setNext] = useState<Cell>(() => makePiece(rng));
  const [score, setScore] = useState(0);
  const start = useRef(Date.now());
  const done = useRef(false);

  const finish = (sc: number) => {
    if (done.current) return;
    done.current = true;
    onDone({ solved: false, score: sc, timeMs: Date.now() - start.current });
  };

  const drop = (i: number) => {
    if (paused || done.current || board[i]) return;
    const res = place(board, i, piece);
    setBoard(res.board);
    if (res.popped > 0)
      setScore((s) => {
        const ns = s + res.popped * 10;
        onScore?.(ns);
        return ns;
      });
    setPiece(next);
    setNext(makePiece(rng));
    if (!hasEmpty(res.board)) setTimeout(() => finish(score + res.popped * 10), 250);
  };
  const dropRef = useRef(drop);
  dropRef.current = drop;

  useEffect(() => {
    if (!isBot || paused || done.current) return;
    const t = setTimeout(() => {
      const i = botMove(board, piece);
      if (i >= 0) dropRef.current(i);
      else finish(score);
    }, botTickMs[difficulty]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, piece, isBot, paused, difficulty]);

  const Hex = ({ cell, i }: { cell: Cell | null; i: number }) => (
    <button
      className={`hx-cell ${cell ? 'full' : ''}`}
      style={cell ? { background: HEX_COLORS[cell.color] } : undefined}
      onClick={() => !isBot && drop(i)}
      disabled={isBot || !!cell}
    >
      {cell ? cell.height : ''}
    </button>
  );

  return (
    <div className="board">
      <div className="board-info">
        <span>Score {score}</span>
      </div>
      <div className="hx-grid">
        {Array.from({ length: ROWS }).map((_, r) => (
          <div key={r} className={`hx-row ${r % 2 ? 'odd' : ''}`}>
            {Array.from({ length: COLS }).map((_, c) => (
              <Hex key={c} cell={board[r * COLS + c]} i={r * COLS + c} />
            ))}
          </div>
        ))}
      </div>
      <div className="hx-queue">
        <span className="hx-q-label">Drop:</span>
        <span className="hx-chip" style={{ background: HEX_COLORS[piece.color] }}>{piece.height}</span>
        <span className="hx-q-label dim">next</span>
        <span className="hx-chip small" style={{ background: HEX_COLORS[next.color] }}>{next.height}</span>
      </div>
      {!isBot && <div className="hint">Tap a cell to drop the stack. Match colors to build piles of {10}!</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: HexaSortSolo };
export default mod;
