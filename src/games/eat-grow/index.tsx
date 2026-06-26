import { useEffect, useRef } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng } from '../../engine/rng';
import { COLORS, DURATION_MS, type Obj, canEat, spawnObjects } from './logic';
import '../games.css';

function EatGrowSolo({ seed, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rng = useRef(makeRng(seed)).current;
  const objs = useRef<Obj[]>(spawnObjects(rng)).current;
  const st = useRef({ hx: 0.5, hy: 0.5, r: 14, tx: 0.5, ty: 0.5, score: 0, over: false });
  const start = useRef(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const botSpeed = difficulty === 'hard' ? 0.06 : difficulty === 'medium' ? 0.045 : 0.03;

    const finish = () => {
      if (st.current.over) return;
      st.current.over = true;
      onDone({ solved: false, score: Math.round(st.current.score), timeMs: DURATION_MS });
    };

    const loop = () => {
      const s = st.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      if (canvas.width !== W * dpr) {
        canvas.width = W * dpr;
        canvas.height = H * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const elapsed = performance.now() - start.current;
      if (elapsed >= DURATION_MS) finish();

      if (!paused && !s.over) {
        if (isBot) {
          // steer toward nearest eatable object
          let best: Obj | null = null;
          let bd = Infinity;
          for (const o of objs) {
            if (o.eaten || !canEat(s.r, o.r)) continue;
            const d = (o.x - s.hx) ** 2 + (o.y - s.hy) ** 2;
            if (d < bd) {
              bd = d;
              best = o;
            }
          }
          if (best) {
            s.tx = best.x;
            s.ty = best.y;
          }
          s.hx += (s.tx - s.hx) * botSpeed * 3;
          s.hy += (s.ty - s.hy) * botSpeed * 3;
        } else {
          s.hx += (s.tx - s.hx) * 0.2;
          s.hy += (s.ty - s.hy) * 0.2;
        }
        // eat
        for (const o of objs) {
          if (o.eaten) continue;
          const dx = (o.x - s.hx) * W;
          const dy = (o.y - s.hy) * H;
          if (Math.hypot(dx, dy) < s.r && canEat(s.r, o.r)) {
            o.eaten = true;
            s.score += o.r;
            s.r += o.r * 0.05;
            onScore?.(Math.round(s.score));
          }
        }
      }

      // draw
      ctx.clearRect(0, 0, W, H);
      for (const o of objs) {
        if (o.eaten) continue;
        ctx.fillStyle = COLORS[o.color];
        ctx.beginPath();
        ctx.arc(o.x * W, o.y * H, o.r, 0, Math.PI * 2);
        ctx.fill();
      }
      // hole
      ctx.fillStyle = 'rgba(10,12,28,0.92)';
      ctx.beginPath();
      ctx.arc(s.hx * W, s.hy * H, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(108,92,255,0.9)';
      ctx.stroke();

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [difficulty, isBot, paused, onDone, onScore, objs]);

  const setTarget = (e: React.PointerEvent) => {
    if (isBot) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    st.current.tx = (e.clientX - rect.left) / rect.width;
    st.current.ty = (e.clientY - rect.top) / rect.height;
  };

  return (
    <div className="board">
      <div className="hint">{isBot ? '🕳️ the bot is feeding…' : 'Drag the hole — swallow anything smaller to grow!'}</div>
      <canvas
        ref={canvasRef}
        className="cv-board"
        style={{ width: 'min(86cqmin, 94cqw, 460px)', height: 'min(78cqh, 520px)' }}
        onPointerDown={setTarget}
        onPointerMove={(e) => e.buttons && setTarget(e)}
      />
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: EatGrowSolo };
export default mod;
