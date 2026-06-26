import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import {
  type Axial,
  type Board,
  CELLS,
  HEX_COLORS,
  type Piece,
  anyPlaceable,
  botMove,
  canPlace,
  emptyBoard,
  makeTray,
  place
} from './logic';
import '../games.css';

const HEXW = 38; // hex cell width (px)
const HEXH = HEXW * 1.1547; // pointy-top ratio
const px = (q: number, r: number) => ({ x: HEXW * (q + r / 2), y: HEXH * 0.75 * r });

function HexaPuzzleSolo({ seed, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const rng = useRef(makeRng(seed)).current;
  const [board, setBoard] = useState<Board>(emptyBoard);
  const [tray, setTray] = useState<Piece[]>(() => makeTray(rng));
  const [sel, setSel] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const start = useRef(Date.now());
  const done = useRef(false);

  const finish = (sc: number) => {
    if (done.current) return;
    done.current = true;
    onDone({ solved: false, score: sc, timeMs: Date.now() - start.current });
  };

  useEffect(() => {
    if (!done.current && tray.length > 0 && !anyPlaceable(board, tray)) finish(score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, tray]);

  const drop = (anchor: Axial) => {
    if (sel == null) return;
    const p = tray[sel];
    if (!canPlace(board, p, anchor)) return;
    const res = place(board, p, anchor);
    const nextCombo = res.cleared > 0 ? combo + 1 : 0;
    const gain = p.cells.length + res.cleared * 20 * Math.max(1, nextCombo);
    setBoard(res.board);
    setCombo(nextCombo);
    setScore((s) => {
      const ns = s + gain;
      onScore?.(ns);
      return ns;
    });
    setTray((t) => {
      const left = t.filter((_, i) => i !== sel);
      return left.length === 0 ? makeTray(rng) : left;
    });
    setSel(null);
  };
  const dropRef = useRef(drop);
  dropRef.current = drop;

  useEffect(() => {
    if (!isBot || paused || done.current) return;
    const t = setTimeout(() => {
      const m = botMove(board, tray);
      if (!m) return finish(score);
      setSel(m.pieceIndex);
      setTimeout(() => dropRef.current(m.anchor), 120);
    }, botTickMs[difficulty] + 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, tray, isBot, paused, difficulty]);

  // bounding box for layout
  const pts = CELLS.map((c) => px(c.q, c.r));
  const minX = Math.min(...pts.map((p) => p.x));
  const minY = Math.min(...pts.map((p) => p.y));
  const boardW = Math.max(...pts.map((p) => p.x)) - minX + HEXW;
  const boardH = Math.max(...pts.map((p) => p.y)) - minY + HEXH;

  const hint = sel != null && tray[sel] ? tray[sel] : null;

  return (
    <div className="board">
      <div className="board-info">
        <span>Score {score}</span>
        {combo > 1 && <span style={{ color: 'var(--warn)' }}>Combo x{combo}</span>}
      </div>
      <div className="hxp-board" style={{ width: boardW, height: boardH }}>
        {CELLS.map((c, i) => {
          const { x, y } = px(c.q, c.r);
          const v = board[i];
          const previewing =
            hint && canPlace(board, tray[sel!], c) ? true : false;
          return (
            <button
              key={i}
              className={`hxp-cell ${v ? 'full' : ''} ${previewing ? 'ok' : ''}`}
              style={{
                left: x - minX,
                top: y - minY,
                width: HEXW,
                height: HEXH,
                background: v ? HEX_COLORS[v - 1] : undefined
              }}
              onClick={() => !isBot && drop(c)}
              disabled={isBot}
            />
          );
        })}
      </div>
      <div className="cb-tray">
        {tray.map((p, pi) => {
          const sp = p.cells.map((c) => px(c.q, c.r));
          const mnX = Math.min(...sp.map((s) => s.x));
          const mnY = Math.min(...sp.map((s) => s.y));
          const w = Math.max(...sp.map((s) => s.x)) - mnX + 18;
          const h = Math.max(...sp.map((s) => s.y)) - mnY + 18;
          return (
            <div
              key={p.id}
              className={`hxp-piece ${sel === pi ? 'sel' : ''}`}
              style={{ width: w, height: h }}
              onClick={() => !isBot && setSel(pi)}
            >
              {p.cells.map((c, k) => {
                const { x, y } = px(c.q, c.r);
                return (
                  <span
                    key={k}
                    className="hxp-mini"
                    style={{ left: (x - mnX) * 0.46, top: (y - mnY) * 0.46, background: HEX_COLORS[p.color] }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
      {!isBot && <div className="hint">Tap a piece, then a cell. Fill a full line to clear it!</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: HexaPuzzleSolo };
export default mod;
