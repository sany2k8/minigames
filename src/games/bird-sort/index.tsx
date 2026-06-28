import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import { useUndo } from '../../engine/useUndo';
import { UndoButton } from '../UndoButton';
// Reuse the proven tube-sort engine: branches == tubes, birds == colored units.
import {
  TUBE_COLORS,
  bestMove,
  canPour,
  generate,
  isSolved,
  pour,
  progress,
  type Tube,
  type WSConfig
} from '../water-sort/logic';
import '../games.css';

function birdConfig(d: 'easy' | 'medium' | 'hard'): WSConfig {
  if (d === 'easy') return { numColors: 4, height: 4, empties: 2 };
  if (d === 'hard') return { numColors: 7, height: 4, empties: 1 };
  return { numColors: 5, height: 4, empties: 1 };
}

function BirdSortSolo({ seed, isBot, difficulty, paused, onProgress, onScore, onDone }: SoloGameProps) {
  const cfg = useRef(birdConfig(difficulty)).current;
  const rng = useRef(makeRng(seed)).current;
  const botRng = useRef(makeRng(seed ^ 0x27d4eb2f)).current;
  const [branches, setBranches] = useState<Tube[]>(() => generate(rng, cfg));
  const [sel, setSel] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const undoer = useUndo<{ branches: Tube[]; moves: number }>();
  const start = useRef(Date.now());
  const done = useRef(false);

  useEffect(() => {
    onProgress?.(progress(branches, cfg.height));
    onScore?.(progress(branches, cfg.height) * 10);
    if (!done.current && isSolved(branches, cfg.height)) {
      done.current = true;
      const elapsed = Date.now() - start.current;
      const score = Math.max(200, 200000 - elapsed - moves * 200);
      onScore?.(score);
      onDone({ solved: true, score, timeMs: elapsed });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches]);

  useEffect(() => {
    if (!isBot || paused || done.current) return;
    const t = setTimeout(() => {
      setBranches((cur) => {
        const m = bestMove(cur, cfg.height, botRng);
        if (!m) return cur;
        setMoves((x) => x + 1);
        return pour(cur, m[0], m[1], cfg.height);
      });
    }, botTickMs[difficulty]);
    return () => clearTimeout(t);
  }, [branches, isBot, paused, difficulty, cfg.height, botRng]);

  const tap = (i: number) => {
    if (isBot || paused || done.current) return;
    if (sel === null) {
      if (branches[i].length > 0) setSel(i);
      return;
    }
    if (sel === i) {
      setSel(null);
      return;
    }
    if (canPour(branches, sel, i, cfg.height)) {
      undoer.record({ branches, moves });
      setBranches((cur) => pour(cur, sel, i, cfg.height));
      setMoves((x) => x + 1);
    }
    setSel(null);
  };

  const undo = () => {
    if (isBot || paused || done.current) return;
    const prev = undoer.undo();
    if (prev) {
      setBranches(prev.branches);
      setMoves(prev.moves);
      setSel(null);
    }
  };

  const flockDone = (t: Tube) => t.length === cfg.height && t.every((c) => c === t[0]);
  return (
    <div className="board">
      <div className="board-info">
        <span>Moves {moves}</span>
        <span>{progress(branches, cfg.height)}%</span>
      </div>
      <div className="bs-tree" style={{ ['--cap' as string]: cfg.height }}>
        {branches.map((t, i) => (
          <div key={i} className={`bs-branch ${sel === i ? 'sel' : ''} ${flockDone(t) ? 'done' : ''}`} onClick={() => tap(i)}>
            <div className="bs-perch" />
            {t.map((c, j) => (
              <span key={j} className="bs-bird" style={{ background: TUBE_COLORS[c] }}>
                <span className="bs-eye" />
                <span className="bs-beak" />
              </span>
            ))}
          </div>
        ))}
      </div>
      {!isBot && (
        <div className="board-actions">
          <UndoButton onUndo={undo} canUndo={undoer.canUndo} />
        </div>
      )}
      {!isBot && <div className="hint">Tap a branch, then another to move birds. One flock per branch 🐦</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: BirdSortSolo };
export default mod;
