import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import {
  ARROWS,
  EMPTY,
  type Board,
  botMove,
  config,
  escapable,
  generate,
  isCleared,
  tilesLeft
} from './logic';
import '../games.css';

function ArrowEscapeSolo({ seed, player, isBot, difficulty, paused, onProgress, onDone }: SoloGameProps) {
  const cfg = useRef(config(difficulty)).current;
  const rng = useRef(makeRng(seed)).current;
  const initial = useRef<Board>(generate(rng, cfg)).current;
  const total = useRef(tilesLeft(initial)).current;
  const [board, setBoard] = useState<Board>(initial);
  const start = useRef(Date.now());
  const done = useRef(false);

  const left = tilesLeft(board);

  useEffect(() => {
    onProgress?.(Math.round(((total - left) / total) * 100));
    if (!done.current && isCleared(board)) {
      done.current = true;
      const elapsed = Date.now() - start.current;
      onDone({ solved: true, score: Math.max(1000, 600000 - elapsed), timeMs: elapsed });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  const remove = (idx: number) => {
    setBoard((b) => {
      const cells = b.cells.slice();
      cells[idx] = EMPTY;
      return { ...b, cells };
    });
  };

  // Bot greedily escapes any reachable tile.
  useEffect(() => {
    if (!isBot || paused || done.current) return;
    const t = setTimeout(() => {
      const idx = botMove(board);
      if (idx >= 0) remove(idx);
    }, botTickMs[difficulty]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, isBot, paused, difficulty]);

  const tap = (idx: number) => {
    if (isBot || paused || done.current) return;
    if (escapable(board, idx)) remove(idx);
  };

  const size = `min(86cqmin, 82cqh, 540px)`;
  return (
    <div className="board">
      <div className="board-info">
        <span>{total - left}/{total} escaped</span>
      </div>
      <div
        className="ae-grid"
        style={{
          gridTemplateColumns: `repeat(${board.w}, 1fr)`,
          width: size,
          ['--game-accent' as string]: player.color
        }}
      >
        {board.cells.map((d, i) => {
          if (d === EMPTY) return <div key={i} className="ae-cell empty" />;
          const canGo = escapable(board, i);
          return (
            <button
              key={i}
              className={`ae-cell tile dir${d} ${canGo ? 'ready' : 'stuck'}`}
              onPointerDown={() => tap(i)}
              disabled={isBot}
            >
              <span>{ARROWS[d]}</span>
            </button>
          );
        })}
      </div>
      {!isBot && <div className="hint">Tap a glowing arrow to escape it — its path to the edge must be clear</div>}
      {isBot && <div className="hint">🤖 clearing a path…</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'race', Solo: ArrowEscapeSolo };
export default mod;
