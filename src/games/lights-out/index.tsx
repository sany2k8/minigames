import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import { type Grid, generate, isSolved, lightsConfig, press, progress } from './logic';
import '../games.css';

function LightsOutSolo({ seed, isBot, difficulty, paused, onProgress, onDone }: SoloGameProps) {
  const cfg = useRef(lightsConfig(difficulty)).current;
  const puzzle = useRef(generate(makeRng(seed), cfg)).current;
  const [grid, setGrid] = useState<Grid>(puzzle.grid);
  const [taps, setTaps] = useState(0);
  const start = useRef(Date.now());
  const done = useRef(false);
  const botStep = useRef(0);

  useEffect(() => {
    onProgress?.(progress(grid));
    if (!done.current && isSolved(grid)) {
      done.current = true;
      const elapsed = Date.now() - start.current;
      onDone({ solved: true, score: Math.max(100, 200000 - elapsed - taps * 300), timeMs: elapsed });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid]);

  const tap = (i: number) => {
    if (isBot || paused || done.current) return;
    setGrid((g) => press(g, i, cfg.n));
    setTaps((t) => t + 1);
  };

  // Bot replays the known solution set, one cell per tick.
  useEffect(() => {
    if (!isBot || paused || done.current) return;
    if (botStep.current >= puzzle.solution.length) return;
    const t = setTimeout(() => {
      const cell = puzzle.solution[botStep.current];
      botStep.current += 1;
      setGrid((g) => press(g, cell, cfg.n));
    }, botTickMs[difficulty] + 150);
    return () => clearTimeout(t);
  }, [grid, isBot, paused, difficulty, cfg.n, puzzle.solution]);

  const lit = grid.filter((v) => v === 1).length;
  const size = 'min(78cqmin, 78cqh, 420px)';
  return (
    <div className="board">
      <div className="board-info">
        <span>Lit {lit}</span>
        <span>Taps {taps}</span>
      </div>
      <div className="lo-grid" style={{ width: size, height: size, gridTemplateColumns: `repeat(${cfg.n}, 1fr)` }}>
        {grid.map((v, i) => (
          <button key={i} className={`lo-cell ${v ? 'on' : 'off'}`} onClick={() => tap(i)} disabled={isBot} aria-label={`light ${i}`} />
        ))}
      </div>
      {!isBot && <div className="hint">Tap a light to flip it and its neighbours. Turn them all off!</div>}
      {isBot && <div className="hint">🤖 flipping the lights…</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'race', Solo: LightsOutSolo };
export default mod;
