import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import { ITEMS, TRAY_SIZE, addToTray, isOverflow } from '../goods-match/logic';
import { DURATION_MS, type Tile, freeTiles, generate, isFree } from './logic';
import '../games.css';

const TW = 38;
const TH = 44;
const OFF = 7;

function TileMatchSolo({ seed, isBot, difficulty, paused, onProgress, onScore, onDone }: SoloGameProps) {
  const rng = useRef(makeRng(seed)).current;
  const faceCount = difficulty === 'easy' ? 6 : difficulty === 'hard' ? 10 : 8;
  const tiles = useRef<Tile[]>(generate(rng, faceCount)).current;
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [tray, setTray] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(Math.ceil(DURATION_MS / 1000));
  const startRef = useRef(0);
  const done = useRef(false);

  const finish = (won: boolean, sc: number) => {
    if (done.current) return;
    done.current = true;
    onScore?.(sc);
    onDone({ solved: won, score: sc, timeMs: DURATION_MS });
  };

  useEffect(() => {
    startRef.current = performance.now();
    const id = setInterval(() => {
      if (paused || done.current) return;
      const left = Math.max(0, Math.ceil((DURATION_MS - (performance.now() - startRef.current)) / 1000));
      setTimeLeft(left);
      if (left <= 0) finish(false, scoreRef.current);
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const scoreRef = useRef(0);
  scoreRef.current = score;

  const pick = (t: Tile) => {
    if (paused || done.current || !isFree(tiles, removed, t)) return;
    const res = addToTray(tray, t.face);
    setTray(res.tray);
    setRemoved((s) => new Set(s).add(t.id));
    if (res.cleared)
      setScore((s) => {
        const ns = s + 30;
        onScore?.(ns);
        return ns;
      });
    if (isOverflow(res.tray)) {
      setTimeout(() => finish(false, scoreRef.current), 250);
      return;
    }
    if (removed.size + 1 === tiles.length) setTimeout(() => finish(true, scoreRef.current + 500), 200);
  };
  const pickRef = useRef(pick);
  pickRef.current = pick;

  useEffect(() => {
    onProgress?.(Math.round((removed.size / tiles.length) * 100));
  }, [removed, onProgress, tiles.length]);

  useEffect(() => {
    if (!isBot || paused || done.current) return;
    const t = setTimeout(() => {
      const free = freeTiles(tiles, removed);
      if (!free.length) return;
      const counts: Record<number, number> = {};
      tray.forEach((f) => (counts[f] = (counts[f] ?? 0) + 1));
      const wanted = free.find((f) => (counts[f.face] ?? 0) >= 1);
      pickRef.current(wanted ?? free[0]);
    }, botTickMs[difficulty]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [removed, tray, isBot, paused, difficulty]);

  const boardW = 6 * TW + 2 * OFF + 10;
  const boardH = 5 * TH + 2 * OFF + 10;
  return (
    <div className="board">
      <div className="board-info">
        <span>⏱ {timeLeft}s</span>
        <span>Score {score}</span>
        <span>Left {tiles.length - removed.size}</span>
      </div>
      <div className="tm-board" style={{ width: boardW, height: boardH }}>
        {tiles
          .filter((t) => !removed.has(t.id))
          .sort((a, b) => a.z - b.z || a.r - b.r)
          .map((t) => {
            const free = isFree(tiles, removed, t);
            return (
              <button
                key={t.id}
                className={`tm-tile ${free ? '' : 'locked'}`}
                style={{ left: t.c * TW + t.z * OFF, top: t.r * TH - t.z * OFF, zIndex: t.z * 10 + t.r }}
                onClick={() => pick(t)}
                disabled={isBot}
              >
                {ITEMS[t.face]}
              </button>
            );
          })}
      </div>
      <div className="gm-tray">
        {Array.from({ length: TRAY_SIZE }).map((_, i) => (
          <div key={i} className={`gm-slot ${i === TRAY_SIZE - 1 ? 'danger' : ''}`}>
            {tray[i] != null ? ITEMS[tray[i]] : ''}
          </div>
        ))}
      </div>
      {!isBot && <div className="hint">Tap free tiles — collect 3 of a kind to clear them!</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: TileMatchSolo };
export default mod;
