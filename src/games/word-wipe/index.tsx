import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import { DURATION_MS, W, adjacent, collapse, findWord, generate, isWord, wordScore } from './logic';
import '../games.css';

function WordWipeSolo({ seed, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const rng = useRef(makeRng(seed)).current;
  const [grid, setGrid] = useState<string[]>(() => generate(rng));
  const [path, setPath] = useState<number[]>([]);
  const pathRef = useRef<number[]>([]);
  const setPathBoth = (p: number[]) => {
    pathRef.current = p;
    setPath(p);
  };
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(Math.ceil(DURATION_MS / 1000));
  const dragging = useRef(false);
  const startRef = useRef(0);
  const done = useRef(false);
  const scoreRef = useRef(0);
  scoreRef.current = score;

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone({ solved: false, score: scoreRef.current, timeMs: DURATION_MS });
  };

  useEffect(() => {
    startRef.current = performance.now();
    const id = setInterval(() => {
      if (paused || done.current) return;
      const left = Math.max(0, Math.ceil((DURATION_MS - (performance.now() - startRef.current)) / 1000));
      setTimeLeft(left);
      if (left <= 0) finish();
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const submitPath = (p: number[]) => {
    const word = p.map((i) => grid[i]).join('');
    if (isWord(word)) {
      const gained = wordScore(word.length);
      setScore((s) => {
        const ns = s + gained;
        onScore?.(ns);
        return ns;
      });
      setGrid((g) => collapse(g, new Set(p), rng));
    }
    setPathBoth([]);
  };

  // bot auto-wipes words
  useEffect(() => {
    if (!isBot || paused || done.current) return;
    const t = setTimeout(() => {
      const found = findWord(grid);
      if (found) submitPath(found);
    }, botTickMs[difficulty] + 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, isBot, paused, difficulty]);

  const cellFromPoint = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y)?.closest('[data-cell]') as HTMLElement | null;
    return el ? Number(el.dataset.cell) : null;
  };
  const extend = (cell: number | null) => {
    if (cell == null || done.current) return;
    const p = pathRef.current;
    if (p.includes(cell)) {
      if (p.indexOf(cell) === p.length - 2) setPathBoth(p.slice(0, -1)); // one-step backtrack
      return;
    }
    if (p.length === 0 || adjacent(p[p.length - 1], cell)) setPathBoth([...p, cell]);
  };

  const current = path.map((i) => grid[i]).join('').toUpperCase();
  const size = 'min(80cqmin, 64cqh, 380px)';
  return (
    <div className="board">
      <div className="board-info">
        <span>⏱ {timeLeft}s</span>
        <span>Score {score}</span>
      </div>
      <div className={`ww-current ${current && isWord(current) ? 'valid' : ''}`}>{current || '—'}</div>
      <div
        className="ww-grid"
        style={{ width: size, gridTemplateColumns: `repeat(${W}, 1fr)` }}
        onPointerDown={(e) => {
          if (isBot) return;
          dragging.current = true;
          extend(cellFromPoint(e.clientX, e.clientY));
        }}
        onPointerMove={(e) => dragging.current && extend(cellFromPoint(e.clientX, e.clientY))}
        onPointerUp={() => {
          dragging.current = false;
          submitPath(pathRef.current);
        }}
        onPointerLeave={() => {
          if (dragging.current) {
            dragging.current = false;
            submitPath(pathRef.current);
          }
        }}
      >
        {grid.map((ch, i) => (
          <div key={i} data-cell={i} className={`ww-cell ${path.includes(i) ? 'on' : ''}`}>
            {ch.toUpperCase()}
          </div>
        ))}
      </div>
      {!isBot && <div className="hint">Drag across touching letters to spell words (3+)</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: WordWipeSolo };
export default mod;
