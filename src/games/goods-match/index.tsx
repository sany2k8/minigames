import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import { ITEMS, TRAY_SIZE, addToTray, difficultyDistinct, generate, isOverflow } from './logic';
import '../games.css';

function GoodsMatchSolo({ seed, isBot, difficulty, paused, onProgress, onScore, onDone }: SoloGameProps) {
  const rng = useRef(makeRng(seed)).current;
  const all = useRef<number[]>(generate(rng, difficultyDistinct(difficulty))).current;
  const [taken, setTaken] = useState<Set<number>>(new Set()); // indices removed from shelf
  const [tray, setTray] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const start = useRef(Date.now());
  const done = useRef(false);

  const finish = (won: boolean, sc: number) => {
    if (done.current) return;
    done.current = true;
    onScore?.(sc);
    onDone({ solved: won, score: sc, timeMs: Date.now() - start.current });
  };

  useEffect(() => {
    onProgress?.(Math.round((taken.size / all.length) * 100));
    if (!done.current && taken.size === all.length && tray.length === 0) finish(true, score + 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taken, tray]);

  const pick = (i: number) => {
    if (paused || done.current || taken.has(i)) return;
    const { tray: nt, cleared } = addToTray(tray, all[i]);
    setTaken((s) => new Set(s).add(i));
    setTray(nt);
    if (cleared)
      setScore((s) => {
        const ns = s + 30;
        onScore?.(ns);
        return ns;
      });
    if (isOverflow(nt)) setTimeout(() => finish(false, score), 300);
  };
  const pickRef = useRef(pick);
  pickRef.current = pick;

  useEffect(() => {
    if (!isBot || paused || done.current) return;
    const t = setTimeout(() => {
      const remaining = all.map((f, i) => ({ f, i })).filter(({ i }) => !taken.has(i));
      if (remaining.length === 0) return;
      // prefer completing a pair already in the tray
      const counts: Record<number, number> = {};
      tray.forEach((f) => (counts[f] = (counts[f] ?? 0) + 1));
      const wanted = remaining.find(({ f }) => (counts[f] ?? 0) >= 1);
      pickRef.current((wanted ?? remaining[0]).i);
    }, botTickMs[difficulty]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taken, tray, isBot, paused, difficulty]);

  return (
    <div className="board">
      <div className="board-info">
        <span>Score {score}</span>
        <span>Left {all.length - taken.size}</span>
      </div>
      <div className="gm-shelf">
        {all.map((f, i) =>
          taken.has(i) ? null : (
            <button key={i} className="gm-item" onClick={() => pick(i)} disabled={isBot}>
              {ITEMS[f]}
            </button>
          )
        )}
      </div>
      <div className="gm-tray">
        {Array.from({ length: TRAY_SIZE }).map((_, i) => (
          <div key={i} className={`gm-slot ${i === TRAY_SIZE - 1 ? 'danger' : ''}`}>
            {tray[i] != null ? ITEMS[tray[i]] : ''}
          </div>
        ))}
      </div>
      {!isBot && <div className="hint">Tap items into the tray — 3 of a kind clears. Don't overflow!</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: GoodsMatchSolo };
export default mod;
