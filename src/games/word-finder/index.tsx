import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng } from '../../engine/rng';
import { BASE_WORDS, DICT, solutionsFor, wordScore } from './words';
import '../games.css';

const ROUND_SECONDS = 45;
const BOT_FRACTION = { easy: 0.4, medium: 0.65, hard: 0.9 } as const;

function WordFinderSolo({ seed, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const rng = useRef(makeRng(seed)).current;
  const base = useRef(BASE_WORDS[seed % BASE_WORDS.length]).current;
  const letters = useRef(rng.shuffle(base.split(''))).current;
  const lettersStr = letters.join('');
  const solutions = useMemo(() => solutionsFor(lettersStr), [lettersStr]);

  const [found, setFound] = useState<Set<string>>(new Set());
  const [picks, setPicks] = useState<number[]>([]); // selected tile indices
  const [time, setTime] = useState(ROUND_SECONDS);
  const start = useRef(Date.now());
  const done = useRef(false);
  const dragging = useRef(false);
  const didDrag = useRef(false);

  const score = useMemo(
    () => [...found].reduce((s, w) => s + wordScore(w), 0),
    [found]
  );

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone({ solved: found.size === solutions.length, score, timeMs: Date.now() - start.current });
  };

  useEffect(() => {
    onScore?.(score);
  }, [score, onScore]);

  // round timer
  useEffect(() => {
    if (paused || done.current) return;
    if (time <= 0) {
      finish();
      return;
    }
    const t = setTimeout(() => setTime((x) => x - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time, paused]);

  // bot reveals words over the round
  useEffect(() => {
    if (!isBot || paused || done.current) return;
    const target = Math.max(1, Math.round(solutions.length * BOT_FRACTION[difficulty]));
    const pool = solutions.slice(0, target);
    const interval = Math.max(500, Math.floor((ROUND_SECONDS * 1000) / (target + 1)));
    let i = 0;
    const id = setInterval(() => {
      if (done.current || i >= pool.length) {
        clearInterval(id);
        return;
      }
      const w = pool[i++];
      setFound((f) => new Set(f).add(w));
    }, interval);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBot, paused]);

  const current = picks.map((i) => letters[i]).join('');

  const submit = () => {
    const w = current.toLowerCase();
    if (w.length >= 3 && DICT.has(w) && !found.has(w)) {
      setFound((f) => new Set(f).add(w));
    }
    setPicks([]);
  };

  const addPick = (i: number) => {
    if (isBot || paused || done.current) return;
    setPicks((p) => (p.includes(i) ? p : [...p, i]));
  };

  const n = letters.length;
  // Percentage coordinates (0..100) so the wheel can scale responsively.
  const pos = (i: number): [number, number] => {
    const a = (-90 + (i * 360) / n) * (Math.PI / 180);
    return [50 + 42 * Math.cos(a), 50 + 42 * Math.sin(a)];
  };

  return (
    <div className="board wf">
      <div className="board-info">
        <span>⏱ {time}s</span>
        <span>Found {found.size}/{solutions.length}</span>
        <span>Score {score}</span>
      </div>

      <div className="wf-board">
        {solutions.map((w) => (
          <span key={w} style={{ display: 'flex', gap: 2 }}>
            {w.split('').map((ch, j) => (
              <span key={j} className={`wf-slot ${found.has(w) ? 'found' : ''}`}>
                {found.has(w) ? ch.toUpperCase() : ''}
              </span>
            ))}
          </span>
        ))}
      </div>

      {!isBot && (
        <>
          <div className="wf-current">{current.toUpperCase() || '…'}</div>
          <div
            className="wf-wheel"
            onPointerUp={() => {
              dragging.current = false;
              if (didDrag.current) submit();
              didDrag.current = false;
            }}
            onPointerLeave={() => (dragging.current = false)}
          >
            <div className="wf-wheel-bg" />
            <svg className="wf-line" viewBox="0 0 100 100" preserveAspectRatio="none">
              {picks.length > 1 && (
                <polyline
                  points={picks.map((i) => pos(i).join(',')).join(' ')}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.85"
                />
              )}
            </svg>
            {letters.map((ch, i) => {
              const [x, y] = pos(i);
              return (
                <button
                  key={i}
                  className={`wf-letter ${picks.includes(i) ? 'on' : ''}`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  onPointerDown={() => {
                    dragging.current = true;
                    didDrag.current = false;
                    addPick(i);
                  }}
                  onPointerEnter={() => {
                    if (dragging.current) {
                      didDrag.current = true;
                      addPick(i);
                    }
                  }}
                >
                  {ch.toUpperCase()}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => setPicks([])}>
              Clear
            </button>
            <button className="btn btn-primary" onClick={submit}>
              Enter
            </button>
            <button className="btn btn-ghost" onClick={finish}>
              Done
            </button>
          </div>
        </>
      )}
      {isBot && <div className="hint">🤖 finding words… {found.size} so far</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: WordFinderSolo };
export default mod;
