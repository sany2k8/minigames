import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { botTickMs } from '../../engine/rng';
import { bfsDist, bfsPath, neighbors, pickPair } from './logic';
import '../games.css';

function WordLadderSolo({ seed, isBot, difficulty, paused, onProgress, onDone }: SoloGameProps) {
  const [start, target] = useRef(pickPair(seed)).current;
  const initialDist = useRef(bfsDist(start, target)).current;
  const [ladder, setLadder] = useState<string[]>([start]);
  const current = ladder[ladder.length - 1];
  const startedAt = useRef(Date.now());
  const done = useRef(false);
  const botPath = useRef<string[] | null>(null);
  const botStep = useRef(1);

  const options = useMemo(() => neighbors(current).sort(), [current]);

  const finish = (solved: boolean) => {
    if (done.current) return;
    done.current = true;
    const elapsed = Date.now() - startedAt.current;
    onDone({ solved, score: solved ? Math.max(1000, 600000 - elapsed) : 0, timeMs: elapsed });
  };

  useEffect(() => {
    if (done.current) return;
    if (current === target) {
      onProgress?.(100);
      finish(true);
      return;
    }
    const dist = bfsDist(current, target);
    const pct = Number.isFinite(dist) ? Math.round((1 - dist / initialDist) * 100) : 0;
    onProgress?.(Math.max(0, Math.min(99, pct)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const pick = (w: string) => {
    if (isBot || paused || done.current) return;
    setLadder((l) => [...l, w]);
  };

  // Bot walks the precomputed shortest ladder.
  useEffect(() => {
    if (!isBot || paused || done.current) return;
    if (!botPath.current) botPath.current = bfsPath(start, target) ?? [start, target];
    const path = botPath.current;
    const t = setTimeout(() => {
      if (botStep.current >= path.length) return;
      const w = path[botStep.current];
      botStep.current += 1;
      setLadder((l) => [...l, w]);
    }, botTickMs[difficulty]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ladder, isBot, paused, difficulty]);

  const letterTiles = (word: string, ref?: string) =>
    word.split('').map((ch, i) => (
      <span key={i} className={`wl-tile ${ref && ref[i] !== ch ? 'changed' : ''}`}>
        {ch.toUpperCase()}
      </span>
    ));

  return (
    <div className="board wl">
      <div className="board-info">
        <span>Start {start.toUpperCase()}</span>
        <span>→</span>
        <span>Goal {target.toUpperCase()}</span>
      </div>

      <div className="wl-goal">{letterTiles(target)}</div>
      <div className="wl-current">{letterTiles(current, ladder[ladder.length - 2])}</div>
      <div className="wl-trail">{ladder.join(' → ').toUpperCase()}</div>

      {!isBot && (
        <>
          <div className="wl-options">
            {options.map((w) => (
              <button key={w} className="wl-opt" onPointerDown={() => pick(w)}>
                {letterTiles(w, current)}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => setLadder((l) => (l.length > 1 ? l.slice(0, -1) : l))}>
              Undo
            </button>
            <button className="btn btn-ghost" onClick={() => setLadder([start])}>
              Restart
            </button>
          </div>
          <div className="hint">Tap a word — it changes exactly one letter. Reach {target.toUpperCase()} first to win.</div>
        </>
      )}
      {isBot && <div className="hint">🤖 climbing the ladder… {current.toUpperCase()}</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'race', Solo: WordLadderSolo };
export default mod;
