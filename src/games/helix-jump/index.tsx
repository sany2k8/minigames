import { useEffect, useRef } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng } from '../../engine/rng';
import { type Ring, aligned, rings, speedFor } from './logic';
import '../games.css';

function HelixJumpSolo({ seed, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rng = useRef(makeRng(seed)).current;
  const ring = useRef<Ring[]>(rings(rng)).current;
  const state = useRef({ scroll: 0, rotation: 0, next: 0, score: 0, over: false, dragX: null as number | null });
  const start = useRef(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const speed = speedFor(difficulty);
    const spacing = 110;
    let last = performance.now();

    const finish = () => {
      if (state.current.over) return;
      state.current.over = true;
      onDone({ solved: false, score: state.current.score * 100, timeMs: Date.now() - start.current });
    };

    const loop = (now: number) => {
      const dt = Math.min(40, now - last);
      last = now;
      const s = state.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      if (canvas.width !== W * dpr) {
        canvas.width = W * dpr;
        canvas.height = H * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!paused && !s.over) {
        s.scroll += speed * dt * 0.12 * (1 + s.score * 0.02);
        if (isBot) {
          const target = (0.5 - ring[s.next]?.gap + 1) % 1;
          let diff = ((target - s.rotation + 1.5) % 1) - 0.5;
          s.rotation = (s.rotation + diff * 0.18 + 1) % 1;
        }
      }

      const ballY = H * 0.28;
      // evaluate the next ring when it reaches the ball
      const ringY = (i: number) => H * 0.5 + i * spacing - s.scroll;
      while (s.next < ring.length && ringY(s.next) <= ballY) {
        const r = ring[s.next];
        if (aligned(r.gap, r.width, s.rotation)) {
          s.score++;
          onScore?.(s.score * 100);
        } else {
          finish();
          break;
        }
        s.next++;
      }

      // draw
      ctx.clearRect(0, 0, W, H);
      for (let i = s.next; i < ring.length; i++) {
        const y = ringY(i);
        if (y > H + 40) break;
        if (y < -40) continue;
        const eff = (ring[i].gap + s.rotation) % 1;
        const gapPx = ring[i].width * W;
        const gapCenter = eff * W;
        ctx.fillStyle = ring[i].danger ? 'rgba(255,93,115,0.85)' : 'rgba(108,92,255,0.7)';
        // draw bar with a gap, wrapping
        ctx.fillRect(0, y, W, 16);
        ctx.clearRect(gapCenter - gapPx / 2, y - 1, gapPx, 18);
        if (gapCenter - gapPx / 2 < 0) ctx.clearRect(W + (gapCenter - gapPx / 2), y - 1, gapPx, 18);
        if (gapCenter + gapPx / 2 > W) ctx.clearRect(gapCenter + gapPx / 2 - W - gapPx, y - 1, gapPx, 18);
      }
      // ball
      ctx.beginPath();
      ctx.fillStyle = '#41d3bd';
      ctx.arc(W / 2, ballY, 11, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [difficulty, isBot, paused, onDone, onScore, ring]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (isBot) return;
    state.current.dragX = e.clientX;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (isBot || state.current.dragX === null) return;
    const dx = e.clientX - state.current.dragX;
    state.current.dragX = e.clientX;
    state.current.rotation = (state.current.rotation + dx / 300 + 1) % 1;
  };
  const onPointerUp = () => {
    state.current.dragX = null;
  };

  return (
    <div className="board">
      <div className="hint">{isBot ? '🤖 threading the gaps…' : 'Drag left/right to spin the tower through the gaps'}</div>
      <canvas
        ref={canvasRef}
        className="cv-board"
        style={{ width: 'min(70cqmin, 92cqw, 380px)', height: 'min(80cqh, 560px)' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: HelixJumpSolo };
export default mod;
