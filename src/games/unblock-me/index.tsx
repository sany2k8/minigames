import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import { useUndo } from '../../engine/useUndo';
import { UndoButton } from '../UndoButton';
// Same sliding-block engine as Traffic Jam, themed as wooden blocks, scored by speed.
import {
  EXIT_ROW,
  GRID,
  type Vehicle,
  difficultyConfig,
  generate,
  isSolved,
  moveVehicle,
  occupancy,
  slideRange
} from '../traffic-jam/logic';
import '../games.css';

const WOODS = ['#c4843f', '#9a6b34', '#b07a3c', '#a8763a', '#8f6330', '#bb8a4c', '#7c5a2e', '#d29856'];

function UnblockMeSolo({ seed, isBot, difficulty, paused, onProgress, onScore, onDone }: SoloGameProps) {
  const cfg = useRef(difficultyConfig(difficulty)).current;
  const rng = useRef(makeRng(seed)).current;
  const puzzle = useRef(generate(rng, cfg)).current;
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => puzzle.vehicles.map((v) => ({ ...v })));
  const [sel, setSel] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const undoer = useUndo<{ vehicles: Vehicle[]; moves: number }>();
  const start = useRef(Date.now());
  const done = useRef(false);
  const botStep = useRef(0);

  const red = vehicles[0];

  useEffect(() => {
    onProgress?.(Math.round((red.c / (GRID - red.len)) * 100));
    if (!done.current && isSolved(vehicles)) {
      done.current = true;
      const elapsed = Date.now() - start.current;
      const score = Math.max(100, 200000 - elapsed - moves * 500);
      onScore?.(score);
      onDone({ solved: true, score, timeMs: elapsed });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles]);

  useEffect(() => {
    if (!isBot || paused || done.current) return;
    if (botStep.current >= puzzle.solution.length) return;
    const t = setTimeout(() => {
      const mv = puzzle.solution[botStep.current];
      botStep.current += 1;
      setVehicles((cur) => moveVehicle(cur, mv.idx, mv.delta));
      setMoves((m) => m + 1);
    }, botTickMs[difficulty] + 250);
    return () => clearTimeout(t);
  }, [vehicles, isBot, paused, difficulty, puzzle.solution]);

  const onCell = (r: number, c: number) => {
    if (isBot || paused || done.current) return;
    const occ = occupancy(vehicles);
    const hit = occ[r * GRID + c];
    if (hit >= 0) {
      setSel(hit);
      return;
    }
    if (sel === null) return;
    const idx = vehicles.findIndex((v) => v.id === sel);
    const v = vehicles[idx];
    const [neg, pos] = slideRange(vehicles, idx);
    let delta = 0;
    if (v.dir === 'h' && r === v.r) {
      if (c > v.c + v.len - 1) delta = Math.min(c - (v.c + v.len - 1), pos);
      else if (c < v.c) delta = -Math.min(v.c - c, neg);
    } else if (v.dir === 'v' && c === v.c) {
      if (r > v.r + v.len - 1) delta = Math.min(r - (v.r + v.len - 1), pos);
      else if (r < v.r) delta = -Math.min(v.r - r, neg);
    }
    if (delta !== 0) {
      undoer.record({ vehicles, moves });
      setVehicles((cur) => moveVehicle(cur, idx, delta));
      setMoves((m) => m + 1);
    }
  };

  const undo = () => {
    if (isBot || paused || done.current) return;
    const prev = undoer.undo();
    if (prev) {
      setVehicles(prev.vehicles);
      setMoves(prev.moves);
      setSel(null);
    }
  };

  const size = 'min(82cqmin, 84cqh, 460px)';
  const pct = (n: number) => `${(n / GRID) * 100}%`;
  return (
    <div className="board">
      <div className="board-info">
        <span>Moves {moves}</span>
        <span>{Math.round((red.c / (GRID - red.len)) * 100)}% out</span>
      </div>
      <div className="tj-board um-board" style={{ width: size, height: size }}>
        {Array.from({ length: GRID * GRID }).map((_, i) => (
          <div key={i} className="tj-cell" onClick={() => onCell(Math.floor(i / GRID), i % GRID)} />
        ))}
        <div className="tj-exit" style={{ top: pct(EXIT_ROW), height: pct(1) }}>➜</div>
        {vehicles.map((v, idx) => (
          <div
            key={v.id}
            className={`tj-veh ${v.id === 0 ? 'red' : ''} ${sel === v.id ? 'sel' : ''}`}
            onClick={() => setSel(v.id)}
            style={{
              left: pct(v.c),
              top: pct(v.r),
              width: pct(v.dir === 'h' ? v.len : 1),
              height: pct(v.dir === 'v' ? v.len : 1),
              background: v.id === 0 ? '#e24b4b' : WOODS[idx % WOODS.length]
            }}
          >
            {v.id === 0 ? '🔑' : ''}
          </div>
        ))}
      </div>
      {!isBot && (
        <div className="board-actions">
          <UndoButton onUndo={undo} canUndo={undoer.canUndo} />
        </div>
      )}
      {!isBot && <div className="hint">Slide the wooden blocks to free the 🔑 block out the right!</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: UnblockMeSolo };
export default mod;
