import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import { sound } from '../../lib/sound';
import { useUndo } from '../../engine/useUndo';
import { UndoButton } from '../UndoButton';
import { SIZE, type Dir, type Grid, botMove, canMove, emptyGrid, move, spawn, tileColor } from './logic';
import '../games.css';

function Merge2048Solo({ seed, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const rng = useRef(makeRng(seed)).current;
  const [grid, setGrid] = useState<Grid>(() => spawn(spawn(emptyGrid(), rng), rng));
  const [score, setScore] = useState(0);
  const undoer = useUndo<{ grid: Grid; score: number }>();
  const start = useRef(Date.now());
  const done = useRef(false);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const finish = (sc: number) => {
    if (done.current) return;
    done.current = true;
    onDone({ solved: false, score: sc, timeMs: Date.now() - start.current });
  };

  const doMove = (dir: Dir) => {
    if (paused || done.current) return;
    if (!isBot && move(grid, dir).moved) undoer.record({ grid, score });
    setGrid((cur) => {
      const res = move(cur, dir);
      if (!res.moved) return cur;
      if (!isBot) (res.gained > 0 ? sound.merge() : sound.move());
      const next = spawn(res.grid, rng);
      setScore((s) => {
        const ns = s + res.gained;
        onScore?.(ns);
        return ns;
      });
      if (!canMove(next)) setTimeout(() => finish(score + res.gained), 250);
      return next;
    });
  };
  const doMoveRef = useRef(doMove);
  doMoveRef.current = doMove;

  const undo = () => {
    if (isBot || paused || done.current) return;
    const prev = undoer.undo();
    if (prev) {
      setGrid(prev.grid);
      setScore(prev.score);
      onScore?.(prev.score);
    }
  };

  // keyboard (human only)
  useEffect(() => {
    if (isBot) return;
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
        a: 'left', d: 'right', w: 'up', s: 'down'
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        doMoveRef.current(dir);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isBot]);

  // bot autoplay
  useEffect(() => {
    if (!isBot || paused || done.current) return;
    const t = setTimeout(() => {
      const d = botMove(grid);
      if (d) doMoveRef.current(d);
      else finish(score);
    }, botTickMs[difficulty]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, isBot, paused, difficulty]);

  const onPointerDown = (e: React.PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (isBot || !swipe.current) return;
    const dx = e.clientX - swipe.current.x;
    const dy = e.clientY - swipe.current.y;
    swipe.current = null;
    if (Math.abs(dx) < 22 && Math.abs(dy) < 22) return;
    if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? 'right' : 'left');
    else doMove(dy > 0 ? 'down' : 'up');
  };

  const size = 'min(74cqmin, 82cqh, 440px)';
  return (
    <div className="board">
      <div className="board-info">
        <span>Score {score}</span>
        <span>Best {Math.max(...grid)}</span>
      </div>
      <div
        className="m2048-grid"
        style={{ width: size, height: size, gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {grid.map((v, i) => {
          const { bg, fg } = tileColor(v);
          return (
            <div key={i} className="m2048-cell">
              {v > 0 && (
                <span
                  key={v}
                  className="m2048-tile pop"
                  style={{ background: bg, color: fg, fontSize: v >= 1024 ? '0.72em' : v >= 128 ? '0.85em' : '1em' }}
                >
                  {v}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {!isBot && (
        <>
          <div className="board-actions">
            <UndoButton onUndo={undo} canUndo={undoer.canUndo} />
            <button className="btn btn-ghost" onClick={() => finish(score)}>
              End round
            </button>
          </div>
          <div className="hint">Swipe or use arrow keys to merge tiles</div>
        </>
      )}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: Merge2048Solo };
export default mod;
