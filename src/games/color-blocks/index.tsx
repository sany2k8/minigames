import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import {
  BLOCK_COLORS,
  N,
  TARGET_LINES,
  anyPlaceable,
  botMove,
  canPlace,
  makeTray,
  place,
  type Grid,
  type Piece
} from './logic';
import '../games.css';

function ColorBlocksSolo({ seed, isBot, difficulty, paused, onProgress, onScore, onDone }: SoloGameProps) {
  const rng = useRef(makeRng(seed)).current;
  const [grid, setGrid] = useState<Grid>(() => Array(N * N).fill(0));
  const [tray, setTray] = useState<Piece[]>(() => makeTray(rng));
  const [sel, setSel] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [lines, setLines] = useState(0);
  const [score, setScore] = useState(0);
  const start = useRef(Date.now());
  const done = useRef(false);

  const refillIfEmpty = (t: Piece[]): Piece[] => (t.length === 0 ? makeTray(rng) : t);

  const finish = (solved: boolean, sc: number) => {
    if (done.current) return;
    done.current = true;
    onDone({ solved, score: sc, timeMs: Date.now() - start.current });
  };

  useEffect(() => {
    onProgress?.(Math.min(100, Math.round((lines / TARGET_LINES) * 100)));
    onScore?.(score);
    if (lines >= TARGET_LINES) finish(true, score + 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, score]);

  // detect game over when no tray piece fits
  useEffect(() => {
    if (!done.current && tray.length > 0 && !anyPlaceable(grid, tray)) {
      finish(false, score);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, tray]);

  const doPlace = (pieceIndex: number, r: number, c: number) => {
    const p = tray[pieceIndex];
    if (!canPlace(grid, p, r, c)) return;
    const res = place(grid, p, r, c);
    setGrid(res.grid);
    setLines((l) => l + res.cleared);
    setScore((s) => s + res.filled + res.cleared * 10);
    setTray((t) => refillIfEmpty(t.filter((_, i) => i !== pieceIndex)));
    setSel(null);
  };

  // bot
  useEffect(() => {
    if (!isBot || paused || done.current) return;
    const t = setTimeout(() => {
      const m = botMove(grid, tray);
      if (m) doPlace(m.pieceIndex, m.r, m.c);
    }, botTickMs[difficulty]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, tray, isBot, paused, difficulty]);

  const tapCell = (r: number, c: number) => {
    if (isBot || paused || done.current || sel === null) return;
    doPlace(sel, r, c);
  };

  // Ghost-preview of the selected piece under the pointer.
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
        <span>Lines {lines}/{TARGET_LINES}</span>
        <span>Score {score}</span>
      </div>
      <div
        className="cb-grid"
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
              onClick={() => tapCell(Math.floor(i / N), i % N)}
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
      {!isBot && <div className="hint">{sel === null ? 'Tap a piece, then a cell' : 'Tap a cell to place it'}</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'race', Solo: ColorBlocksSolo };
export default mod;
