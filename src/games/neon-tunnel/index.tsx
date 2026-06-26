import { useEffect, useRef } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng } from '../../engine/rng';
import '../games.css';

interface Obs {
  x: number; // center 0..1
  w: number; // half width 0..1
  y: number; // 0..1 (top->bottom)
  color: string;
}
const COLORS = ['#ff007f', '#bc13fe', '#00f3ff', '#41d3bd'];

function NeonTunnelSolo({ seed, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rng = useRef(makeRng(seed)).current;
  const st = useRef({ shipX: 0.5, target: 0.5, obs: [] as Obs[], score: 0, over: false, t: 0, dragging: false });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    let last = performance.now();
    const base = difficulty === 'hard' ? 0.45 : difficulty === 'medium' ? 0.34 : 0.26;
    const shipY = 0.84;
    const shipHW = 0.05;
    let spawnAcc = 0;

    const finish = () => {
      if (st.current.over) return;
      st.current.over = true;
      onDone({ solved: false, score: Math.round(st.current.score), timeMs: 0 });
    };

    const loop = (now: number) => {
      const s = st.current;
      const dt = Math.min(40, now - last);
      last = now;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = canvas.clientWidth;
      const Hh = canvas.clientHeight;
      if (canvas.width !== W * dpr) {
        canvas.width = W * dpr;
        canvas.height = Hh * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!paused && !s.over) {
        s.t += dt;
        const speed = base + s.t * 0.000004;
        // spawn
        spawnAcc += dt;
        if (spawnAcc > 520 - Math.min(300, s.t * 0.02)) {
          spawnAcc = 0;
          s.obs.push({ x: 0.12 + rng.float() * 0.76, w: 0.08 + rng.float() * 0.1, y: -0.05, color: rng.pick(COLORS) });
        }
        // move
        for (const o of s.obs) o.y += speed * dt * 0.04;
        // bot steering: avoid nearest obstacle ahead
        if (isBot) {
          const ahead = s.obs.filter((o) => o.y < shipY && o.y > shipY - 0.5).sort((a, b) => b.y - a.y)[0];
          if (ahead) {
            const leftSpace = ahead.x - ahead.w;
            const rightSpace = 1 - (ahead.x + ahead.w);
            s.target = leftSpace > rightSpace ? Math.max(0.06, ahead.x - ahead.w - shipHW) : Math.min(0.94, ahead.x + ahead.w + shipHW);
          }
        }
        s.shipX += (s.target - s.shipX) * 0.2;
        s.shipX = Math.max(0.05, Math.min(0.95, s.shipX));
        // collision + scoring
        for (const o of s.obs) {
          if (Math.abs(o.y - shipY) < 0.035 && Math.abs(o.x - s.shipX) < o.w + shipHW) finish();
        }
        const before = s.obs.length;
        s.obs = s.obs.filter((o) => o.y < 1.1);
        s.score += (before - s.obs.length) * 10 + dt * 0.01;
        onScore?.(Math.round(s.score));
      }

      // draw
      ctx.clearRect(0, 0, W, Hh);
      // tunnel side walls
      ctx.fillStyle = 'rgba(188,19,254,0.12)';
      ctx.fillRect(0, 0, W * 0.04, Hh);
      ctx.fillRect(W * 0.96, 0, W * 0.04, Hh);
      // obstacles
      for (const o of s.obs) {
        ctx.fillStyle = o.color;
        ctx.shadowColor = o.color;
        ctx.shadowBlur = 12;
        ctx.fillRect((o.x - o.w) * W, o.y * Hh, o.w * 2 * W, 16);
      }
      ctx.shadowBlur = 0;
      // ship
      const sx = s.shipX * W;
      const sy = shipY * Hh;
      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(sx, sy - 14);
      ctx.lineTo(sx - 12, sy + 12);
      ctx.lineTo(sx + 12, sy + 12);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [difficulty, isBot, paused, onDone, onScore, rng]);

  const setTarget = (e: React.PointerEvent) => {
    if (isBot) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    st.current.target = (e.clientX - rect.left) / rect.width;
  };

  return (
    <div className="board">
      <div className="hint">{isBot ? '🚀 the bot is dodging…' : 'Drag left/right to fly through the neon tunnel'}</div>
      <canvas
        ref={canvasRef}
        className="cv-board"
        style={{ width: 'min(64cqmin, 92cqw, 360px)', height: 'min(82cqh, 600px)' }}
        onPointerDown={(e) => {
          st.current.dragging = true;
          setTarget(e);
        }}
        onPointerMove={(e) => st.current.dragging && setTarget(e)}
        onPointerUp={() => (st.current.dragging = false)}
        onPointerLeave={() => (st.current.dragging = false)}
      />
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: NeonTunnelSolo };
export default mod;
