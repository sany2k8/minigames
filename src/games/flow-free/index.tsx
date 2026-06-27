import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import { useUndo } from '../../engine/useUndo';
import { UndoButton } from '../UndoButton';
import {
  FLOW_COLORS,
  type FlowPuzzle,
  adjacent,
  coverage,
  dotColorMap,
  flowConfig,
  generate,
  isConnected
} from './logic';
import '../games.css';

function FlowFreeSolo({ seed, isBot, difficulty, paused, onProgress, onDone }: SoloGameProps) {
  const cfg = useRef(flowConfig(difficulty)).current;
  const rng = useRef(makeRng(seed)).current;
  const puz = useRef<FlowPuzzle>(generate(rng, cfg.w, cfg.h)).current;
  const dotMap = useRef(dotColorMap(puz)).current;
  const [paths, setPaths] = useState<Record<number, number[]>>({});
  const pathsRef = useRef(paths);
  pathsRef.current = paths;
  const active = useRef<number | null>(null);
  const undoer = useUndo<Record<number, number[]>>();
  const start = useRef(Date.now());
  const done = useRef(false);

  const colorOfCell = (cell: number, p = pathsRef.current): number => {
    for (const k in p) if (p[k].includes(cell)) return Number(k);
    return dotMap.has(cell) ? dotMap.get(cell)! : -1;
  };

  const commit = (next: Record<number, number[]>) => {
    pathsRef.current = next;
    setPaths(next);
  };

  const connectedCount = () =>
    puz.endpoints.filter((d, k) => isConnected(pathsRef.current[k] ?? [], d)).length;

  useEffect(() => {
    const total = cfg.w * cfg.h;
    const conn = puz.endpoints.filter((d, k) => isConnected(paths[k] ?? [], d)).length;
    onProgress?.(Math.round((conn / puz.endpoints.length) * 100));
    if (!done.current && conn === puz.endpoints.length && coverage(paths).size === total) {
      done.current = true;
      onDone({ solved: true, score: Math.max(100, 200000 - (Date.now() - start.current)), timeMs: Date.now() - start.current });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paths]);

  const cellFromPoint = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y)?.closest('[data-cell]') as HTMLElement | null;
    return el ? Number(el.dataset.cell) : null;
  };

  const beginAt = (cell: number) => {
    const color = colorOfCell(cell);
    if (color < 0) return;
    // Snapshot before a new stroke so Undo reverts the whole connection.
    undoer.record({ ...pathsRef.current });
    const next = { ...pathsRef.current };
    if (dotMap.get(cell) === color) next[color] = [cell];
    else {
      const cur = next[color] ?? [];
      const idx = cur.indexOf(cell);
      next[color] = idx >= 0 ? cur.slice(0, idx + 1) : [cell];
    }
    active.current = color;
    commit(next);
  };

  const extendTo = (cell: number) => {
    const color = active.current;
    if (color === null || done.current || paused) return;
    const next = { ...pathsRef.current };
    const path = next[color] ?? [];
    const last = path[path.length - 1];
    if (cell === last) return;
    if (!adjacent(cfg.w, cell, last)) return;
    const here = path.indexOf(cell);
    if (here >= 0) {
      next[color] = path.slice(0, here + 1); // backtrack
      commit(next);
      return;
    }
    // can't run into a different color's dot
    if (dotMap.has(cell) && dotMap.get(cell) !== color) return;
    // overwrite other colors' tail at this cell
    for (const k in next) {
      if (Number(k) === color) continue;
      const idx = next[k].indexOf(cell);
      if (idx >= 0) next[k] = next[k].slice(0, idx);
    }
    next[color] = [...path, cell];
    if (dotMap.get(cell) === color && cell !== path[0]) active.current = null; // reached partner
    commit(next);
  };

  // bot replays the solution one color at a time
  useEffect(() => {
    if (!isBot || paused || done.current) return;
    const t = setTimeout(() => {
      const k = puz.solution.findIndex((sol, color) => (paths[color] ?? []).length !== sol.length);
      if (k < 0) return;
      commit({ ...pathsRef.current, [k]: puz.solution[k].slice() });
    }, botTickMs[difficulty]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paths, isBot, paused, difficulty]);

  const undo = () => {
    if (isBot || paused || done.current) return;
    const prev = undoer.undo();
    if (prev) {
      active.current = null;
      commit(prev);
    }
  };

  const cellColor = (cell: number) => colorOfCell(cell, paths);
  const size = `min(82cqmin, 84cqh, 460px)`;
  return (
    <div className="board">
      <div className="board-info">
        <span>Pipes {connectedCount()}/{puz.endpoints.length}</span>
      </div>
      <div
        className="ff-grid"
        style={{ width: size, height: size, gridTemplateColumns: `repeat(${cfg.w}, 1fr)` }}
        onPointerDown={(e) => {
          if (isBot) return;
          const c = cellFromPoint(e.clientX, e.clientY);
          if (c != null) beginAt(c);
        }}
        onPointerMove={(e) => {
          if (isBot || active.current === null) return;
          const c = cellFromPoint(e.clientX, e.clientY);
          if (c != null) extendTo(c);
        }}
        onPointerUp={() => (active.current = null)}
        onPointerLeave={() => (active.current = null)}
      >
        {Array.from({ length: cfg.w * cfg.h }).map((_, i) => {
          const col = cellColor(i);
          const isDot = dotMap.has(i);
          return (
            <div key={i} data-cell={i} className="ff-cell">
              {col >= 0 && <span className="ff-fill" style={{ background: FLOW_COLORS[col % FLOW_COLORS.length] }} />}
              {isDot && <span className="ff-dot" style={{ background: FLOW_COLORS[col % FLOW_COLORS.length] }} />}
            </div>
          );
        })}
      </div>
      {!isBot && (
        <div className="board-actions">
          <UndoButton onUndo={undo} canUndo={undoer.canUndo} />
        </div>
      )}
      {!isBot && <div className="hint">Drag between matching dots to connect every color and fill the grid</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'race', Solo: FlowFreeSolo };
export default mod;
