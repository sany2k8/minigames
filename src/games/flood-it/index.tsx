import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import { useUndo } from '../../engine/useUndo';
import { UndoButton } from '../UndoButton';
import { FLOOD_COLORS, type FloodConfig, botColor, flood, floodConfig, generate, isSolved, progress, region } from './logic';
import '../games.css';

function FloodItSolo({ seed, isBot, difficulty, paused, onProgress, onDone }: SoloGameProps) {
  const cfg = useRef<FloodConfig>(floodConfig(difficulty)).current;
  const rng = useRef(makeRng(seed)).current;
  const [grid, setGrid] = useState<number[]>(() => generate(rng, cfg));
  const [moves, setMoves] = useState(0);
  const undoer = useUndo<{ grid: number[]; moves: number }>();
  const start = useRef(Date.now());
  const done = useRef(false);

  const finish = (g: number[], usedMoves: number) => {
    if (done.current) return;
    done.current = true;
    const solved = isSolved(g);
    onDone({
      solved,
      score: solved ? Math.max(100, (cfg.moves - usedMoves + 1) * 100) : progress(g, cfg.n) * 5,
      timeMs: Date.now() - start.current
    });
  };

  useEffect(() => {
    onProgress?.(progress(grid, cfg.n));
    if (!done.current && isSolved(grid)) finish(grid, moves);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid]);

  const pick = (color: number) => {
    if (isBot || paused || done.current || color === grid[0]) return;
    undoer.record({ grid, moves });
    const ng = flood(grid, cfg.n, color);
    const m = moves + 1;
    setGrid(ng);
    setMoves(m);
    if (!isSolved(ng) && m >= cfg.moves) setTimeout(() => finish(ng, m), 200);
  };

  const undo = () => {
    if (isBot || paused || done.current) return;
    const prev = undoer.undo();
    if (prev) {
      setGrid(prev.grid);
      setMoves(prev.moves);
    }
  };

  useEffect(() => {
    if (!isBot || paused || done.current) return;
    const t = setTimeout(() => {
      setGrid((g) => {
        if (isSolved(g)) return g;
        const ng = flood(g, cfg.n, botColor(g, cfg.n, cfg.colors));
        setMoves((m) => {
          const nm = m + 1;
          if (!isSolved(ng) && nm >= cfg.moves) setTimeout(() => finish(ng, nm), 100);
          return nm;
        });
        return ng;
      });
    }, botTickMs[difficulty]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, isBot, paused, difficulty]);

  const reg = new Set(region(grid, cfg.n));
  const size = 'min(78cqmin, 72cqh, 440px)';
  return (
    <div className="board">
      <div className="board-info">
        <span>Moves {moves}/{cfg.moves}</span>
        <span>{progress(grid, cfg.n)}%</span>
      </div>
      <div className="fl-grid" style={{ width: size, height: size, gridTemplateColumns: `repeat(${cfg.n}, 1fr)` }}>
        {grid.map((v, i) => (
          <div
            key={i}
            className={`fl-cell ${reg.has(i) ? 'reg' : ''}`}
            style={{ background: FLOOD_COLORS[v] }}
          />
        ))}
      </div>
      <div className="fl-picker">
        {Array.from({ length: cfg.colors }).map((_, c) => (
          <button
            key={c}
            className="fl-swatch"
            style={{ background: FLOOD_COLORS[c], opacity: c === grid[0] ? 0.4 : 1 }}
            onClick={() => pick(c)}
            disabled={isBot}
            aria-label={`color ${c}`}
          />
        ))}
      </div>
      {!isBot && (
        <div className="board-actions">
          <UndoButton onUndo={undo} canUndo={undoer.canUndo} />
        </div>
      )}
      {!isBot && <div className="hint">Pick a color to flood from the top-left. Fill the board!</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'race', Solo: FloodItSolo };
export default mod;
