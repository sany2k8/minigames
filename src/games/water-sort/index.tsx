import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import { useUndo } from '../../engine/useUndo';
import { UndoButton } from '../UndoButton';
import {
  TUBE_COLORS,
  bestMove,
  canPour,
  difficultyConfig,
  generate,
  isSolved,
  pour,
  progress,
  type Tube
} from './logic';
import '../games.css';

function WaterSortSolo({ seed, isBot, difficulty, paused, onProgress, onDone }: SoloGameProps) {
  const cfg = useRef(difficultyConfig(difficulty)).current;
  const rng = useRef(makeRng(seed)).current;
  const botRng = useRef(makeRng(seed ^ 0x9e3779b9)).current;
  const [tubes, setTubes] = useState<Tube[]>(() => generate(rng, cfg));
  const [sel, setSel] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const undoer = useUndo<{ tubes: Tube[]; moves: number }>();
  const start = useRef(Date.now());
  const finished = useRef(false);

  const finish = (t: Tube[]) => {
    if (finished.current) return;
    if (isSolved(t, cfg.height)) {
      finished.current = true;
      const elapsed = Date.now() - start.current;
      onDone({ solved: true, score: Math.max(100, 200000 - elapsed - moves * 200), timeMs: elapsed });
    }
  };

  useEffect(() => {
    onProgress?.(progress(tubes, cfg.height));
    finish(tubes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tubes]);

  // Bot autoplay.
  useEffect(() => {
    if (!isBot || paused || finished.current) return;
    const t = setTimeout(() => {
      setTubes((cur) => {
        const m = bestMove(cur, cfg.height, botRng);
        if (!m) return cur;
        setMoves((x) => x + 1);
        return pour(cur, m[0], m[1], cfg.height);
      });
    }, botTickMs[difficulty]);
    return () => clearTimeout(t);
  }, [tubes, isBot, paused, difficulty, cfg.height, botRng]);

  const tap = (i: number) => {
    if (isBot || paused || finished.current) return;
    if (sel === null) {
      if (tubes[i].length > 0) setSel(i);
      return;
    }
    if (sel === i) {
      setSel(null);
      return;
    }
    if (canPour(tubes, sel, i, cfg.height)) {
      undoer.record({ tubes, moves });
      setTubes((cur) => pour(cur, sel, i, cfg.height));
      setMoves((x) => x + 1);
    }
    setSel(null);
  };

  const undo = () => {
    if (isBot || paused || finished.current) return;
    const prev = undoer.undo();
    if (prev) {
      setTubes(prev.tubes);
      setMoves(prev.moves);
      setSel(null);
    }
  };

  const tubeDone = (t: Tube) => t.length === cfg.height && t.every((c) => c === t[0]);
  return (
    <div className="board">
      <div className="board-info">
        <span>Moves {moves}</span>
        <span>{progress(tubes, cfg.height)}%</span>
      </div>
      <div className="ws-tubes" style={{ ['--cap' as string]: cfg.height }}>
        {tubes.map((t, i) => (
          <div
            key={i}
            className={`ws-tube ${sel === i ? 'sel' : ''} ${tubeDone(t) ? 'done' : ''}`}
            onClick={() => tap(i)}
          >
            {t.map((c, j) => (
              <div key={j} className="ws-seg" style={{ background: TUBE_COLORS[c] }} />
            ))}
          </div>
        ))}
      </div>
      {!isBot && (
        <div className="board-actions">
          <UndoButton onUndo={undo} canUndo={undoer.canUndo} />
        </div>
      )}
      {!isBot && <div className="hint">Tap a tube, then tap where to pour</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'race', Solo: WaterSortSolo };
export default mod;
