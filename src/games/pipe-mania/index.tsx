import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import { useUndo } from '../../engine/useUndo';
import { UndoButton } from '../UndoButton';
import {
  type Cell,
  type PipeBoard,
  generate,
  isSolved,
  openings,
  pipeConfig,
  progress,
  reachable
} from './logic';
import '../games.css';

const EDGE: Record<number, [number, number]> = { 0: [50, 2], 1: [98, 50], 2: [50, 98], 3: [2, 50] };

function PipeGlyph({ cell, filled }: { cell: Cell; filled: boolean }) {
  const om = openings(cell);
  const color = filled ? 'var(--accent-2)' : '#7a85b8';
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      {[0, 1, 2, 3].map((d) =>
        om & (1 << d) ? (
          <line key={d} x1="50" y1="50" x2={EDGE[d][0]} y2={EDGE[d][1]} stroke={color} strokeWidth="15" strokeLinecap="round" />
        ) : null
      )}
      <circle cx="50" cy="50" r="9" fill={color} />
    </svg>
  );
}

function PipeManiaSolo({ seed, isBot, difficulty, paused, onProgress, onDone }: SoloGameProps) {
  const cfg = useRef(pipeConfig(difficulty)).current;
  const rng = useRef(makeRng(seed)).current;
  const gen = useRef(generate(rng, cfg.w, cfg.h)).current;
  const [board, setBoard] = useState<PipeBoard>(() => ({
    ...gen.board,
    cells: gen.board.cells.map((c) => ({ ...c }))
  }));
  const undoer = useUndo<PipeBoard>();
  const start = useRef(Date.now());
  const done = useRef(false);

  useEffect(() => {
    onProgress?.(progress(board, gen.solution));
    if (!done.current && isSolved(board)) {
      done.current = true;
      onDone({ solved: true, score: Math.max(100, 200000 - (Date.now() - start.current)), timeMs: Date.now() - start.current });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  const rotate = (i: number) => {
    if (isBot || paused || done.current || board.cells[i].fixed) return;
    undoer.record(board);
    setBoard((b) => {
      const cells = b.cells.map((c, j) => (j === i ? { ...c, rot: (c.rot + 1) % 4 } : c));
      return { ...b, cells };
    });
  };

  const undo = () => {
    if (isBot || paused || done.current) return;
    const prev = undoer.undo();
    if (prev) setBoard(prev);
  };

  useEffect(() => {
    if (!isBot || paused || done.current) return;
    const t = setTimeout(() => {
      setBoard((b) => {
        const wrong = b.cells.findIndex((c, i) => c.onPath && !c.fixed && c.rot !== gen.solution[i]);
        if (wrong < 0) return b;
        const cells = b.cells.map((c, j) => (j === wrong ? { ...c, rot: gen.solution[wrong] } : c));
        return { ...b, cells };
      });
    }, botTickMs[difficulty]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, isBot, paused, difficulty]);

  const filled = reachable(board);
  const size = `min(80cqmin, 82cqh, 460px)`;
  return (
    <div className="board">
      <div className="board-info">
        <span>{progress(board, gen.solution)}% aligned</span>
      </div>
      <div className="pm-grid" style={{ width: size, height: size, gridTemplateColumns: `repeat(${board.w}, 1fr)` }}>
        {board.cells.map((cell, i) => (
          <div
            key={i}
            className={`pm-cell ${cell.fixed ? 'fixed' : ''} ${filled.has(i) ? 'filled' : ''}`}
            onClick={() => rotate(i)}
          >
            <PipeGlyph cell={cell} filled={filled.has(i)} />
            {i === board.source && <span className="pm-marker">💧</span>}
            {i === board.outlet && <span className="pm-marker">🌸</span>}
          </div>
        ))}
      </div>
      {!isBot && (
        <div className="board-actions">
          <UndoButton onUndo={undo} canUndo={undoer.canUndo} />
        </div>
      )}
      {!isBot && <div className="hint">Tap pipes to rotate. Connect 💧 to 🌸!</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'race', Solo: PipeManiaSolo };
export default mod;
