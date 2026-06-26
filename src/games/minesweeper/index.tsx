import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import { type MineBoard, generate, isWon, mineConfig, reveal, safeCells } from './logic';
import '../games.css';

const NUM_COLORS = ['', '#41a0ff', '#51e08a', '#ff5d73', '#8367ff', '#ff8c42', '#41d3bd', '#ffd166', '#aab2e0'];

function MinesweeperSolo({ seed, isBot, difficulty, paused, onProgress, onScore, onDone }: SoloGameProps) {
  const cfg = useRef(mineConfig(difficulty)).current;
  const rng = useRef(makeRng(seed)).current;
  const board = useRef<MineBoard>(generate(rng, cfg)).current;
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [flags, setFlags] = useState<Set<number>>(new Set());
  const [dead, setDead] = useState(false);
  const start = useRef(Date.now());
  const done = useRef(false);
  const press = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = safeCells(board);

  const finish = (won: boolean, count: number) => {
    if (done.current) return;
    done.current = true;
    const score = won ? Math.max(200, 100000 - (Date.now() - start.current)) : count * 50;
    onScore?.(score);
    onDone({ solved: won, score, timeMs: Date.now() - start.current });
  };

  useEffect(() => {
    onProgress?.(Math.round((revealed.size / total) * 100));
    if (!done.current && isWon(board, revealed)) finish(true, revealed.size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed]);

  const open = (i: number) => {
    if (paused || done.current || revealed.has(i) || flags.has(i)) return;
    if (board.mine[i]) {
      setDead(true);
      setTimeout(() => finish(false, revealed.size), 400);
      return;
    }
    setRevealed((r) => reveal(board, r, i));
  };
  const toggleFlag = (i: number) => {
    if (paused || done.current || revealed.has(i)) return;
    setFlags((f) => {
      const n = new Set(f);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  };
  const openRef = useRef(open);
  openRef.current = open;

  // bot reveals known-safe cells
  useEffect(() => {
    if (!isBot || paused || done.current) return;
    const t = setTimeout(() => {
      const next = board.mine.findIndex((m, i) => !m && !revealed.has(i));
      if (next >= 0) openRef.current(next);
    }, botTickMs[difficulty]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, isBot, paused, difficulty]);

  const size = `min(82cqmin, 84cqh, 460px)`;
  return (
    <div className="board">
      <div className="board-info">
        <span>💣 {cfg.mines - flags.size}</span>
        <span>{revealed.size}/{total}</span>
      </div>
      <div className="ms-grid" style={{ width: size, gridTemplateColumns: `repeat(${board.w}, 1fr)` }}>
        {Array.from({ length: board.w * board.h }).map((_, i) => {
          const isRev = revealed.has(i);
          const showMine = dead && board.mine[i];
          return (
            <button
              key={i}
              className={`ms-cell ${isRev ? 'open' : ''}`}
              disabled={isBot}
              onClick={() => open(i)}
              onContextMenu={(e) => {
                e.preventDefault();
                toggleFlag(i);
              }}
              onPointerDown={() => {
                press.current = setTimeout(() => toggleFlag(i), 350);
              }}
              onPointerUp={() => press.current && clearTimeout(press.current)}
              onPointerLeave={() => press.current && clearTimeout(press.current)}
            >
              {showMine ? '💣' : flags.has(i) ? '🚩' : isRev && board.count[i] > 0 ? (
                <span style={{ color: NUM_COLORS[board.count[i]] }}>{board.count[i]}</span>
              ) : ''}
            </button>
          );
        })}
      </div>
      {!isBot && <div className="hint">Tap to reveal · long-press (or right-click) to flag 🚩</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: MinesweeperSolo };
export default mod;
