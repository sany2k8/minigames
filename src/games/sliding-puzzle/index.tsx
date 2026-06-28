import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import { useUndo } from '../../engine/useUndo';
import { UndoButton } from '../UndoButton';
import { type Board, generate, isSolved, moveBlank, progress, slideConfig, tapTile } from './logic';
import '../games.css';

function SlidingPuzzleSolo({ seed, isBot, difficulty, paused, onProgress, onDone }: SoloGameProps) {
  const cfg = useRef(slideConfig(difficulty)).current;
  const puzzle = useRef(generate(makeRng(seed), cfg)).current;
  const [board, setBoard] = useState<Board>(puzzle.board);
  const [moves, setMoves] = useState(0);
  const undoer = useUndo<{ board: Board; moves: number }>();
  const start = useRef(Date.now());
  const done = useRef(false);
  const botStep = useRef(0);

  useEffect(() => {
    onProgress?.(progress(board));
    if (!done.current && isSolved(board)) {
      done.current = true;
      const elapsed = Date.now() - start.current;
      onDone({ solved: true, score: Math.max(100, 200000 - elapsed - moves * 150), timeMs: elapsed });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  const tap = (idx: number) => {
    if (isBot || paused || done.current) return;
    const nb = tapTile(board, cfg.n, idx);
    if (!nb) return;
    undoer.record({ board, moves });
    setBoard(nb);
    setMoves((m) => m + 1);
  };

  const undo = () => {
    if (isBot || paused || done.current) return;
    const prev = undoer.undo();
    if (prev) {
      setBoard(prev.board);
      setMoves(prev.moves);
    }
  };

  // Bot replays the known solution.
  useEffect(() => {
    if (!isBot || paused || done.current) return;
    if (botStep.current >= puzzle.solution.length) return;
    const t = setTimeout(() => {
      const d = puzzle.solution[botStep.current];
      botStep.current += 1;
      setBoard((b) => moveBlank(b, cfg.n, d) ?? b);
    }, botTickMs[difficulty]);
    return () => clearTimeout(t);
  }, [board, isBot, paused, difficulty, cfg.n, puzzle.solution]);

  const size = `min(${cfg.n * 22}cqmin, 80cqh, ${cfg.n * 110}px)`;
  return (
    <div className="board">
      <div className="board-info">
        <span>{progress(board)}% solved</span>
        <span>Moves {moves}</span>
      </div>
      <div className="sp-grid" style={{ width: size, gridTemplateColumns: `repeat(${cfg.n}, 1fr)` }}>
        {board.map((v, i) =>
          v === 0 ? (
            <div key={i} className="sp-tile blank" />
          ) : (
            <button key={i} className="sp-tile" onClick={() => tap(i)} disabled={isBot}>
              {v}
            </button>
          )
        )}
      </div>
      {!isBot && (
        <div className="board-actions">
          <UndoButton onUndo={undo} canUndo={undoer.canUndo} />
        </div>
      )}
      {!isBot && <div className="hint">Tap a tile next to the gap to slide it. Order them 1→{cfg.n * cfg.n - 1}.</div>}
      {isBot && <div className="hint">🤖 sliding tiles into place…</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'race', Solo: SlidingPuzzleSolo };
export default mod;
