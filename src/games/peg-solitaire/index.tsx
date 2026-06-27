import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import { useUndo } from '../../engine/useUndo';
import { UndoButton } from '../UndoButton';
import { type Board, SIZE, applyMove, initBoard, legalMoves, movesFrom, pegsLeft, scoreOf } from './logic';
import '../games.css';

function PegSolitaireSolo({ seed, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const botRng = useRef(makeRng(seed ^ 0x1234)).current;
  const [board, setBoard] = useState<Board>(initBoard);
  const [sel, setSel] = useState<number | null>(null);
  const undoer = useUndo<Board>();
  const start = useRef(Date.now());
  const done = useRef(false);

  const finish = (b: Board) => {
    if (done.current) return;
    done.current = true;
    onScore?.(scoreOf(b));
    onDone({ solved: pegsLeft(b) === 1, score: scoreOf(b), timeMs: Date.now() - start.current });
  };

  useEffect(() => {
    onScore?.(scoreOf(board));
    if (!done.current && legalMoves(board).length === 0) setTimeout(() => finish(board), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  const targets = sel != null ? movesFrom(board, sel) : [];
  const targetTo = new Set(targets.map((m) => m.to));

  const tap = (i: number) => {
    if (isBot || paused || done.current) return;
    if (board[i] === 1) {
      setSel(i === sel ? null : i);
      return;
    }
    if (sel != null && targetTo.has(i)) {
      const mv = targets.find((m) => m.to === i)!;
      undoer.record(board);
      setBoard((b) => applyMove(b, mv));
      setSel(null);
    }
  };

  const undo = () => {
    if (isBot || paused || done.current) return;
    const prev = undoer.undo();
    if (prev) {
      setBoard(prev);
      setSel(null);
    }
  };

  useEffect(() => {
    if (!isBot || paused || done.current) return;
    const t = setTimeout(() => {
      const moves = legalMoves(board);
      if (moves.length === 0) return;
      // prefer moves that keep more future options
      const pick = moves
        .map((m) => ({ m, opts: legalMoves(applyMove(board, m)).length }))
        .sort((a, b) => b.opts - a.opts);
      const choice = difficulty === 'easy' ? botRng.pick(moves) : pick[0].m;
      setBoard((b) => applyMove(b, choice));
    }, botTickMs[difficulty]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, isBot, paused, difficulty]);

  const size = 'min(80cqmin, 80cqh, 420px)';
  return (
    <div className="board">
      <div className="board-info">
        <span>Pegs {pegsLeft(board)}</span>
        <span>Score {scoreOf(board)}</span>
      </div>
      <div className="pg-grid" style={{ width: size, height: size, gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
        {Array.from({ length: SIZE * SIZE }).map((_, i) => {
          const v = board[i];
          if (v === -1) return <div key={i} className="pg-void" />;
          return (
            <div
              key={i}
              className={`pg-hole ${targetTo.has(i) ? 'target' : ''}`}
              onClick={() => tap(i)}
            >
              {v === 1 && <span className={`pg-peg ${sel === i ? 'sel' : ''}`} />}
            </div>
          );
        })}
      </div>
      {!isBot && (
        <div className="board-actions">
          <UndoButton onUndo={undo} canUndo={undoer.canUndo} />
        </div>
      )}
      {!isBot && <div className="hint">Tap a peg, then a highlighted hole to jump. Leave one peg!</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: PegSolitaireSolo };
export default mod;
