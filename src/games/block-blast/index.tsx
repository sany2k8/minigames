import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import { sound } from '../../lib/sound';
// Reuse the proven block-placement engine; Block Blast is the score+combo cousin.
import {
  BLOCK_COLORS,
  N,
  anyPlaceable,
  botMove,
  canPlace,
  makeTray,
  place,
  type Grid,
  type Piece
} from '../color-blocks/logic';
import '../games.css';

function BlockBlastSolo({ seed, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const rng = useRef(makeRng(seed)).current;
  const [grid, setGrid] = useState<Grid>(() => Array(N * N).fill(0));
  const [tray, setTray] = useState<Piece[]>(() => makeTray(rng));
  const [sel, setSel] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState(false);
  const start = useRef(Date.now());
  const done = useRef(false);

  const finish = (sc: number) => {
    if (done.current) return;
    done.current = true;
    onDone({ solved: false, score: sc, timeMs: Date.now() - start.current });
  };

  useEffect(() => {
    if (!done.current && tray.length > 0 && !anyPlaceable(grid, tray)) finish(score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, tray]);

  const doPlace = (pieceIndex: number, r: number, c: number) => {
    const p = tray[pieceIndex];
    if (!canPlace(grid, p, r, c)) return;
    const res = place(grid, p, r, c);
    const nextCombo = res.cleared > 0 ? combo + 1 : 0;
    const gain = res.filled + res.cleared * 10 * Math.max(1, nextCombo);
    setGrid(res.grid);
    setCombo(nextCombo);
    setScore((s) => {
      const ns = s + gain;
      onScore?.(ns);
      return ns;
    });
    if (!isBot) (res.cleared > 0 ? sound.clear() : sound.place());
    if (res.cleared > 0) {
      setFlash(true);
      setTimeout(() => setFlash(false), 220);
    }
    setTray((t) => {
      const left = t.filter((_, i) => i !== pieceIndex);
      return left.length === 0 ? makeTray(rng) : left;
    });
    setSel(null);
  };
  const doPlaceRef = useRef(doPlace);
  doPlaceRef.current = doPlace;

  useEffect(() => {
    if (!isBot || paused || done.current) return;
    const t = setTimeout(() => {
      const m = botMove(grid, tray);
      if (m) doPlaceRef.current(m.pieceIndex, m.r, m.c);
      else finish(score);
    }, botTickMs[difficulty]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, tray, isBot, paused, difficulty]);

  const piece = sel != null ? tray[sel] : null;
  const previewCells = new Set<number>();
  let previewValid = false;
  if (piece && hover != null) {
    const hr = Math.floor(hover / N);
    const hc = hover % N;
    previewValid = canPlace(grid, piece, hr, hc);
    for (const [dr, dc] of piece.cells) {
      const rr = hr + dr;
      const cc = hc + dc;
      if (rr < N && cc < N) previewCells.add(rr * N + cc);
    }
  }

  const boardSize = 'min(70cqmin, 78cqh, 480px)';
  return (
    <div className="board">
      <div className="board-info">
        <span>Score {score}</span>
        {combo > 1 && <span style={{ color: 'var(--warn)' }}>Combo x{combo}</span>}
      </div>
      <div
        className={`cb-grid ${flash ? 'blast' : ''}`}
        style={{ gridTemplateColumns: `repeat(${N}, 1fr)`, width: boardSize, height: boardSize }}
        onMouseLeave={() => setHover(null)}
      >
        {grid.map((v, i) => {
          const isPreview = previewCells.has(i);
          const cls = v
            ? 'cb-cell filled'
            : `cb-cell ${isPreview ? (previewValid ? 'preview' : 'bad') : ''}`;
          return (
            <div
              key={i}
              className={cls}
              style={{ background: v ? BLOCK_COLORS[v - 1] : undefined }}
              onMouseEnter={() => setHover(i)}
              onClick={() => !isBot && sel != null && doPlace(sel, Math.floor(i / N), i % N)}
            />
          );
        })}
      </div>
      <div className="cb-tray">
        {tray.map((p, pi) => {
          const maxC = Math.max(...p.cells.map((c) => c[1])) + 1;
          const maxR = Math.max(...p.cells.map((c) => c[0])) + 1;
          const set = new Set(p.cells.map(([r, c]) => r * 10 + c));
          return (
            <div
              key={p.id}
              className={`cb-piece ${sel === pi ? 'sel' : ''}`}
              style={{ gridTemplateColumns: `repeat(${maxC}, 15px)` }}
              onClick={() => !isBot && setSel(pi)}
            >
              {Array.from({ length: maxR * maxC }).map((_, k) => {
                const r = Math.floor(k / maxC);
                const c = k % maxC;
                return (
                  <div
                    key={k}
                    className="cb-pc"
                    style={{ background: set.has(r * 10 + c) ? BLOCK_COLORS[p.color] : 'transparent' }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
      {!isBot && <div className="hint">{sel === null ? 'Tap a piece, then a cell' : 'Tap a cell to place — clear lines for combos!'}</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: BlockBlastSolo };
export default mod;
