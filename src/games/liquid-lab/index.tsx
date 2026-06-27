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
} from '../water-sort/logic';
import '../games.css';

function LiquidLabSolo({ seed, isBot, difficulty, paused, onProgress, onScore, onDone }: SoloGameProps) {
  const cfg = useRef(difficultyConfig(difficulty)).current;
  const rng = useRef(makeRng(seed)).current;
  const botRng = useRef(makeRng(seed ^ 0x5bd1e995)).current;
  const [tubes, setTubes] = useState<Tube[]>(() => generate(rng, cfg));
  const [sel, setSel] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const undoer = useUndo<{ tubes: Tube[]; moves: number }>();
  const start = useRef(Date.now());
  const done = useRef(false);

  useEffect(() => {
    onProgress?.(progress(tubes, cfg.height));
    onScore?.(progress(tubes, cfg.height) * 10);
    if (!done.current && isSolved(tubes, cfg.height)) {
      done.current = true;
      const elapsed = Date.now() - start.current;
      const score = Math.max(200, 200000 - elapsed - moves * 200);
      onScore?.(score);
      onDone({ solved: true, score, timeMs: elapsed });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tubes]);

  useEffect(() => {
    if (!isBot || paused || done.current) return;
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
    if (isBot || paused || done.current) return;
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
    if (isBot || paused || done.current) return;
    const prev = undoer.undo();
    if (prev) {
      setTubes(prev.tubes);
      setMoves(prev.moves);
      setSel(null);
    }
  };

  const segH = 26;
  const tubeDone = (t: Tube) => t.length === cfg.height && t.every((c) => c === t[0]);
  return (
    <div className="board">
      <div className="board-info">
        <span>Moves {moves}</span>
        <span>{progress(tubes, cfg.height)}%</span>
      </div>
      <div className="ws-tubes lab-tubes">
        {tubes.map((t, i) => (
          <div
            key={i}
            className={`ws-tube lab-tube ${sel === i ? 'sel' : ''} ${tubeDone(t) ? 'done' : ''}`}
            style={{ height: cfg.height * segH }}
            onClick={() => tap(i)}
          >
            {t.map((c, j) => (
              <div key={j} className="ws-seg" style={{ height: segH, background: TUBE_COLORS[c] }}>
                {tubeDone(t) && <span className="lab-fizz" />}
              </div>
            ))}
          </div>
        ))}
      </div>
      {!isBot && (
        <div className="board-actions">
          <UndoButton onUndo={undo} canUndo={undoer.canUndo} />
        </div>
      )}
      {!isBot && <div className="hint">Pour to sort each chemical into its own tube ⚗️</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: LiquidLabSolo };
export default mod;
