import { useEffect, useRef } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { type Config, botSteer, centerAt, clampCenter, config, hwAt, isCrash } from './logic';
import '../games.css';

function MagneticPullSolo({ seed, player, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cfg = useRef<Config>(config(difficulty)).current;
  const hold = useRef<-1 | 0 | 1>(0);
  const state = useRef({ dist: 0, bx: 0.5, bvx: 0, over: false, score: 0 });
  const startedAt = useRef(Date.now());
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    let last = performance.now();
    const ballScreenFrac = 0.74;

    const finish = () => {
      if (state.current.over) return;
      state.current.over = true;
      onDone({ solved: false, score: state.current.score, timeMs: Date.now() - startedAt.current });
    };

    const loop = (now: number) => {
      const dt = Math.min(40, now - last);
      last = now;
      const s = state.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      if (canvas.width !== Math.round(W * dpr)) {
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const ballScreenY = H * ballScreenFrac;

      if (!pausedRef.current && !s.over) {
        const speed = cfg.speed * (1 + s.dist * 0.00002);
        s.dist += speed * dt;

        let dir: -1 | 0 | 1 = hold.current;
        if (isBot) {
          const c = clampCenter(centerAt(seed, s.dist), hwAt(cfg, s.dist));
          // small deadzone => the bot jitters and, as the corridor narrows,
          // eventually overshoots and crashes (keeps the round finite).
          dir = botSteer(s.bx, c, 0.012);
        }
        s.bvx += dir * cfg.magnet * dt;
        s.bvx *= Math.pow(0.9, dt / 16);
        s.bvx = Math.max(-0.01, Math.min(0.01, s.bvx));
        s.bx += s.bvx * dt;
        s.bx = Math.max(0, Math.min(1, s.bx));

        const center = clampCenter(centerAt(seed, s.dist), hwAt(cfg, s.dist));
        const hw = hwAt(cfg, s.dist);
        if (s.bx <= 0.001 || s.bx >= 0.999 || isCrash(s.bx, center, hw, cfg.ballR)) {
          finish();
        } else {
          const sc = Math.floor(s.dist / 8);
          if (sc !== s.score) {
            s.score = sc;
            onScore?.(sc);
          }
        }
      }

      // ---- draw ----
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(0, 0, W, H);

      const accent = player.color;
      for (let y = -2; y <= H + 2; y += 4) {
        const worldY = s.dist + (ballScreenY - y);
        const hw = hwAt(cfg, worldY);
        const c = clampCenter(centerAt(seed, worldY), hw);
        const leftPx = (c - hw) * W;
        const rightPx = (c + hw) * W;
        ctx.fillStyle = 'rgba(108,92,255,0.18)';
        ctx.fillRect(0, y, leftPx, 4);
        ctx.fillRect(rightPx, y, W - rightPx, 4);
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.55;
        ctx.fillRect(leftPx - 3, y, 3, 4);
        ctx.fillRect(rightPx, y, 3, 4);
        ctx.globalAlpha = 1;
      }

      // magnet glow on the active side
      const drawDir = isBot
        ? botSteer(s.bx, clampCenter(centerAt(seed, s.dist), hwAt(cfg, s.dist)), 0.012)
        : hold.current;
      if (drawDir === -1) {
        ctx.fillStyle = 'rgba(0,243,255,0.18)';
        ctx.fillRect(0, 0, W * 0.16, H);
      } else if (drawDir === 1) {
        ctx.fillStyle = 'rgba(0,243,255,0.18)';
        ctx.fillRect(W * 0.84, 0, W * 0.16, H);
      }

      // ball (metallic)
      const bxPx = s.bx * W;
      const r = cfg.ballR * W;
      const grad = ctx.createRadialGradient(bxPx - r * 0.3, ballScreenY - r * 0.3, r * 0.2, bxPx, ballScreenY, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#cfd6e6');
      grad.addColorStop(1, '#7b8499');
      ctx.beginPath();
      ctx.fillStyle = grad;
      ctx.arc(bxPx, ballScreenY, r, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [seed, cfg, isBot, player.color, onDone, onScore]);

  const setHoldFromX = (clientX: number) => {
    if (isBot) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    hold.current = clientX - rect.left < rect.width / 2 ? -1 : 1;
  };
  const release = () => {
    hold.current = 0;
  };

  useEffect(() => {
    if (isBot) return;
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') hold.current = -1;
      else if (e.key === 'ArrowRight') hold.current = 1;
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hold.current === -1) hold.current = 0;
      if (e.key === 'ArrowRight' && hold.current === 1) hold.current = 0;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [isBot]);

  return (
    <div className="board">
      <div className="hint">
        {isBot ? '🤖 magnetising through the bends…' : 'Hold the LEFT or RIGHT side (or ← →) to pull the ball — stay inside the corridor'}
      </div>
      <canvas
        ref={canvasRef}
        className="cv-board mag"
        style={{ width: 'min(62cqmin, 92cqw, 360px)', height: 'min(82cqh, 580px)', touchAction: 'none' }}
        onPointerDown={(e) => setHoldFromX(e.clientX)}
        onPointerMove={(e) => {
          if (hold.current !== 0) setHoldFromX(e.clientX);
        }}
        onPointerUp={release}
        onPointerLeave={release}
      />
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: MagneticPullSolo };
export default mod;
