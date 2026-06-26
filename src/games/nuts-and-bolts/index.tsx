import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
// Reuse the proven tube-sort mechanic; bolts == tubes, nuts == colored units.
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

function nbConfig(d: 'easy' | 'medium' | 'hard'): WSConfig {
  if (d === 'easy') return { numColors: 4, height: 4, empties: 2 };
  if (d === 'hard') return { numColors: 7, height: 5, empties: 1 };
  return { numColors: 5, height: 4, empties: 1 };
}

function NutsBoltsSolo({ seed, isBot, difficulty, paused, onProgress, onDone }: SoloGameProps) {
  const cfg = useRef(nbConfig(difficulty)).current;
  const rng = useRef(makeRng(seed)).current;
  const botRng = useRef(makeRng(seed ^ 0x85ebca6b)).current;
  const [bolts, setBolts] = useState<Tube[]>(() => generate(rng, cfg));
  const [sel, setSel] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const start = useRef(Date.now());
  const done = useRef(false);

  useEffect(() => {
    onProgress?.(progress(bolts, cfg.height));
    if (!done.current && isSolved(bolts, cfg.height)) {
      done.current = true;
      const elapsed = Date.now() - start.current;
      onDone({ solved: true, score: Math.max(100, 200000 - elapsed - moves * 200), timeMs: elapsed });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bolts]);

  useEffect(() => {
    if (!isBot || paused || done.current) return;
    const t = setTimeout(() => {
      setBolts((cur) => {
        const m = bestMove(cur, cfg.height, botRng);
        if (!m) return cur;
        setMoves((x) => x + 1);
        return pour(cur, m[0], m[1], cfg.height);
      });
    }, botTickMs[difficulty]);
    return () => clearTimeout(t);
  }, [bolts, isBot, paused, difficulty, cfg.height, botRng]);

  const tap = (i: number) => {
    if (isBot || paused || done.current) return;
    if (sel === null) {
      if (bolts[i].length > 0) setSel(i);
      return;
    }
    if (sel === i) {
      setSel(null);
      return;
    }
    if (canPour(bolts, sel, i, cfg.height)) {
      setBolts((cur) => pour(cur, sel, i, cfg.height));
      setMoves((x) => x + 1);
    }
    setSel(null);
  };

  return (
    <div className="board">
      <div className="board-info">
        <span>Moves {moves}</span>
        <span>{progress(bolts, cfg.height)}%</span>
      </div>
      <div className="nb-row" style={{ ['--cap' as string]: cfg.height }}>
        {bolts.map((b, i) => (
          <div
            key={i}
            className={`nb-bolt ${sel === i ? 'sel' : ''}`}
            onClick={() => tap(i)}
          >
            <div className="nb-shaft" />
            {b.map((c, j) => (
              <div key={j} className="nb-nut" style={{ background: TUBE_COLORS[c] }} />
            ))}
          </div>
        ))}
      </div>
      {!isBot && <div className="hint">Tap a bolt, then tap another to move nuts</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'race', Solo: NutsBoltsSolo };
export default mod;
