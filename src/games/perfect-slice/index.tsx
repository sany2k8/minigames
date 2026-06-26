import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import {
  type Config,
  type Pt,
  applyCut,
  config,
  equalVerticalCuts,
  generate,
  polygonArea,
  sliceScore
} from './logic';
import '../games.css';

const FILLS = ['#6c5cff', '#41d3bd', '#ffd166', '#ff5d73', '#00f3ff', '#51e08a', '#bc13fe', '#ff9f43'];

function PerfectSliceSolo({ seed, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const cfg = useRef<Config>(config(difficulty)).current;
  const rng = useRef(makeRng(seed)).current;
  const shape = useRef<Pt[]>(generate(rng, cfg)).current;

  const [pieces, setPieces] = useState<Pt[][]>(() => [shape]);
  const [cutsUsed, setCutsUsed] = useState(0);
  const [drag, setDrag] = useState<{ start: Pt; cur: Pt } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const startedAt = useRef(Date.now());
  const done = useRef(false);
  const botPlan = useRef<number[] | null>(null);
  const botStep = useRef(0);

  const score = sliceScore(pieces, cfg.pieces);

  const finish = (final: Pt[][]) => {
    if (done.current) return;
    done.current = true;
    const sc = sliceScore(final, cfg.pieces);
    onDone({ solved: sc >= 88, score: sc * 100, timeMs: Date.now() - startedAt.current });
  };

  useEffect(() => {
    onScore?.(score * 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const cut = (a: Pt, b: Pt) => {
    if (done.current) return;
    const next = applyCut(pieces, a, b);
    const used = cutsUsed + 1;
    setPieces(next);
    setCutsUsed(used);
    if (used >= cfg.cuts) finish(next);
  };

  // Bot applies equal-area vertical cuts.
  useEffect(() => {
    if (!isBot || paused || done.current) return;
    if (!botPlan.current) botPlan.current = equalVerticalCuts(shape, cfg.pieces);
    const plan = botPlan.current;
    const t = setTimeout(() => {
      if (botStep.current >= plan.length) return;
      const x = plan[botStep.current];
      botStep.current += 1;
      cut({ x, y: -10 }, { x, y: 110 });
    }, botTickMs[difficulty]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieces, isBot, paused, difficulty]);

  const toVB = (e: React.PointerEvent): Pt => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    };
  };

  const onDown = (e: React.PointerEvent) => {
    if (isBot || paused || done.current) return;
    const p = toVB(e);
    setDrag({ start: p, cur: p });
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag) return;
    setDrag({ start: drag.start, cur: toVB(e) });
  };
  const onUp = () => {
    if (!drag) return;
    const { start, cur } = drag;
    setDrag(null);
    const len = Math.hypot(cur.x - start.x, cur.y - start.y);
    if (len > 6) cut(start, cur);
  };

  // Extend the guide line across the whole board for a clean preview.
  const guide = drag
    ? (() => {
        const { start, cur } = drag;
        const dx = cur.x - start.x;
        const dy = cur.y - start.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = (dx / len) * 200;
        const uy = (dy / len) * 200;
        return { x1: start.x - ux, y1: start.y - uy, x2: start.x + ux, y2: start.y + uy };
      })()
    : null;

  const total = polygonArea(shape);

  return (
    <div className="board">
      <div className="board-info">
        <span>Cuts {cutsUsed}/{cfg.cuts}</span>
        <span>Target {cfg.pieces} equal</span>
        <span>Match {score}%</span>
      </div>

      <svg
        ref={svgRef}
        className="ps-board"
        viewBox="0 0 100 100"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      >
        {pieces.map((piece, i) => {
          const frac = total > 0 ? polygonArea(piece) / (total / cfg.pieces) : 0;
          // closer to 1.0 share => fuller opacity
          const op = 0.45 + 0.5 * Math.max(0, 1 - Math.abs(1 - frac));
          return (
            <polygon
              key={i}
              points={piece.map((p) => `${p.x},${p.y}`).join(' ')}
              fill={FILLS[i % FILLS.length]}
              fillOpacity={op}
              stroke="#0b1020"
              strokeWidth={0.8}
              strokeLinejoin="round"
            />
          );
        })}
        {guide && (
          <line
            x1={guide.x1}
            y1={guide.y1}
            x2={guide.x2}
            y2={guide.y2}
            stroke="#fff"
            strokeWidth={0.7}
            strokeDasharray="2 1.5"
            opacity={0.9}
          />
        )}
      </svg>

      {!isBot && (
        <div className="hint">
          {cutsUsed >= cfg.cuts
            ? `Done — ${score}% match`
            : `Drag a straight line to slice. Split the shape into ${cfg.pieces} equal pieces with ${cfg.cuts} cut${cfg.cuts > 1 ? 's' : ''}.`}
        </div>
      )}
      {isBot && <div className="hint">🤖 measuring equal slices… {score}%</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: PerfectSliceSolo };
export default mod;
