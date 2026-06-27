import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import { UndoButton } from '../UndoButton';
import { generate, isSolved, mazeConfig, type Maze } from './logic';
import '../games.css';

function MazePaintSolo({ seed, player, isBot, difficulty, paused, onProgress, onDone }: SoloGameProps) {
  const cfg = useRef(mazeConfig(difficulty)).current;
  const rng = useRef(makeRng(seed)).current;
  const maze = useRef<Maze>(generate(rng, cfg.w, cfg.h)).current;
  const [path, setPath] = useState<number[]>([maze.start]);
  const start = useRef(Date.now());
  const done = useRef(false);
  const botStep = useRef(1);
  const dragging = useRef(false);

  const painted = new Set(path);
  const head = path[path.length - 1];

  useEffect(() => {
    onProgress?.(Math.round((painted.size / maze.open.size) * 100));
    if (!done.current && isSolved(maze, painted)) {
      done.current = true;
      const elapsed = Date.now() - start.current;
      onDone({ solved: true, score: Math.max(100, 200000 - elapsed), timeMs: elapsed });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  // Bot replays the known solution.
  useEffect(() => {
    if (!isBot || paused || done.current) return;
    if (botStep.current >= maze.order.length) return;
    const t = setTimeout(() => {
      const next = maze.order[botStep.current];
      botStep.current += 1;
      setPath((p) => [...p, next]);
    }, botTickMs[difficulty]);
    return () => clearTimeout(t);
  }, [path, isBot, paused, difficulty, maze.order]);

  const move = (target: number) => {
    if (isBot || paused || done.current) return;
    // undo: tapping the previous cell steps back
    if (path.length >= 2 && target === path[path.length - 2]) {
      setPath((p) => p.slice(0, -1));
      return;
    }
    if (!maze.open.has(target) || painted.has(target)) return;
    const [hr, hc] = [Math.floor(head / maze.w), head % maze.w];
    const [tr, tc] = [Math.floor(target / maze.w), target % maze.w];
    if (Math.abs(hr - tr) + Math.abs(hc - tc) !== 1) return; // must be adjacent
    setPath((p) => [...p, target]);
  };

  const undo = () => {
    if (isBot || paused || done.current) return;
    setPath((p) => (p.length > 1 ? p.slice(0, -1) : p));
  };

  const cx = (i: number) => (i % maze.w) + 0.5;
  const cy = (i: number) => Math.floor(i / maze.w) + 0.5;
  const points = path.map((i) => `${cx(i)},${cy(i)}`).join(' ');
  const aid = `mp-arrow-${player.seat}`;

  const size = 'min(80cqmin, 82cqh, 540px)';
  return (
    <div className="board">
      <div className="board-info">
        <span>{painted.size}/{maze.open.size} painted</span>
      </div>
      <div
        className="mp-wrap"
        style={{ width: size, aspectRatio: `${maze.w} / ${maze.h}`, ['--game-accent' as string]: player.color }}
      >
        <div
          className="mp-grid"
          style={{ gridTemplateColumns: `repeat(${maze.w}, 1fr)` }}
          onPointerUp={() => (dragging.current = false)}
          onPointerLeave={() => (dragging.current = false)}
        >
          {Array.from({ length: maze.w * maze.h }).map((_, i) => (
            <div
              key={i}
              className={`mp-cell ${maze.open.has(i) ? 'open' : 'wall'}`}
              onPointerDown={() => {
                dragging.current = true;
                move(i);
              }}
              onPointerEnter={() => dragging.current && move(i)}
            />
          ))}
        </div>
        {/* The painted route, drawn as one thick arrow stroke */}
        <svg className="mp-arrows" viewBox={`0 0 ${maze.w} ${maze.h}`} preserveAspectRatio="none">
          <defs>
            <marker id={aid} markerWidth="3" markerHeight="3" refX="1.4" refY="1.5" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M0,0 L3,1.5 L0,3 Z" fill="var(--game-accent)" />
            </marker>
          </defs>
          <circle cx={cx(maze.start)} cy={cy(maze.start)} r="0.3" fill="#fff" />
          {path.length > 1 && (
            <polyline
              points={points}
              fill="none"
              stroke="var(--game-accent)"
              strokeWidth="0.62"
              strokeLinecap="round"
              strokeLinejoin="round"
              markerEnd={`url(#${aid})`}
            />
          )}
          {/* head glow */}
          <circle cx={cx(head)} cy={cy(head)} r="0.34" fill="#fff" opacity="0.95" />
        </svg>
      </div>
      {!isBot && (
        <div className="board-actions">
          <UndoButton onUndo={undo} canUndo={path.length > 1} />
        </div>
      )}
      {!isBot && <div className="hint">Drag from the dot to paint every tile in one continuous stroke</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'race', Solo: MazePaintSolo };
export default mod;
