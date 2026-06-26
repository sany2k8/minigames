import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import { FACES, type Tile, findPair, freeTiles, generate, isFree } from './logic';
import '../games.css';

const TW = 36;
const TH = 46;
const OFF = 6;

function MahjongMiniSolo({ seed, isBot, difficulty, paused, onProgress, onScore, onDone }: SoloGameProps) {
  const rng = useRef(makeRng(seed)).current;
  const tiles = useRef<Tile[]>(generate(rng)).current;
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [sel, setSel] = useState<number | null>(null);
  const start = useRef(Date.now());
  const done = useRef(false);

  const total = tiles.length;

  const finish = (won: boolean) => {
    if (done.current) return;
    done.current = true;
    const pairs = removed.size / 2;
    const score = pairs * 100 + (won ? 1000 : 0);
    onScore?.(score);
    onDone({ solved: won, score, timeMs: Date.now() - start.current });
  };

  useEffect(() => {
    onProgress?.(Math.round((removed.size / total) * 100));
    if (done.current) return;
    if (removed.size === total) finish(true);
    else if (!findPair(tiles, removed)) setTimeout(() => finish(false), 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [removed]);

  const clickTile = (t: Tile) => {
    if (isBot || paused || done.current || !isFree(tiles, removed, t)) return;
    if (sel === null) {
      setSel(t.id);
      return;
    }
    if (sel === t.id) {
      setSel(null);
      return;
    }
    const prev = tiles.find((x) => x.id === sel)!;
    if (prev.face === t.face) {
      setRemoved((r) => new Set(r).add(prev.id).add(t.id));
      setSel(null);
    } else {
      setSel(t.id);
    }
  };

  useEffect(() => {
    if (!isBot || paused || done.current) return;
    const t = setTimeout(() => {
      const pair = findPair(tiles, removed);
      if (pair) setRemoved((r) => new Set(r).add(pair[0].id).add(pair[1].id));
    }, botTickMs[difficulty]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [removed, isBot, paused, difficulty]);

  const boardW = 6 * TW + 2 * OFF + 8;
  const boardH = 4 * TH + 2 * OFF + 8;
  return (
    <div className="board">
      <div className="board-info">
        <span>Pairs {removed.size / 2}/{total / 2}</span>
      </div>
      <div className="mj-board" style={{ width: boardW, height: boardH }}>
        {tiles
          .filter((t) => !removed.has(t.id))
          .sort((a, b) => a.z - b.z || a.r - b.r)
          .map((t) => {
            const free = isFree(tiles, removed, t);
            return (
              <button
                key={t.id}
                className={`mj-tile ${free ? 'free' : 'locked'} ${sel === t.id ? 'sel' : ''}`}
                style={{
                  left: t.c * TW + t.z * OFF,
                  top: t.r * TH - t.z * OFF,
                  zIndex: t.z * 10 + t.r
                }}
                onClick={() => clickTile(t)}
              >
                {FACES[t.face]}
              </button>
            );
          })}
      </div>
      {!isBot && <div className="hint">Match free tiles (open on a side). {freeTiles(tiles, removed).length} free</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: MahjongMiniSolo };
export default mod;
