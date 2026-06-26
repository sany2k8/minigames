import { useEffect, useRef } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng } from '../../engine/rng';
import { BALLS, COLS, ROWS, blockColor, newRow } from './logic';
import '../games.css';

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
}

function BrickBreakerSolo({ seed, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rng = useRef(makeRng(seed)).current;
  const grid = useRef<number[][]>([newRow(rng, 1)]).current;
  const st = useRef({
    phase: 'aim' as 'aim' | 'fire',
    angle: -Math.PI / 2,
    balls: [] as Ball[],
    queued: 0,
    level: 1,
    score: 0,
    over: false,
    aiming: false
  });
  const start = useRef(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    let lastShot = 0;
    const ballR = 6;
    const speed = difficulty === 'hard' ? 9 : difficulty === 'medium' ? 7.5 : 6;

    const finish = () => {
      if (st.current.over) return;
      st.current.over = true;
      onDone({ solved: false, score: st.current.score * 50, timeMs: Date.now() - start.current });
    };

    const advance = () => {
      const s = st.current;
      // shift down, add new top row
      grid.unshift(newRow(rng, s.level));
      if (grid.length > ROWS) grid.pop();
      s.level++;
      // game over if a block reached the last visible row
      if (grid.length >= ROWS && grid[ROWS - 1].some((h) => h > 0)) {
        finish();
        return;
      }
      s.phase = 'aim';
    };

    const loop = (now: number) => {
      const s = st.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      if (canvas.width !== W * dpr) {
        canvas.width = W * dpr;
        canvas.height = H * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cell = W / COLS;
      const launchX = W / 2;
      const launchY = H - 14;

      if (s.phase === 'fire' && !paused && !s.over) {
        // spawn queued balls staggered
        if (s.queued > 0 && now - lastShot > 90) {
          s.balls.push({ x: launchX, y: launchY, vx: Math.cos(s.angle) * speed, vy: Math.sin(s.angle) * speed, active: true });
          s.queued--;
          lastShot = now;
        }
        for (const b of s.balls) {
          if (!b.active) continue;
          b.x += b.vx;
          b.y += b.vy;
          if (b.x < ballR) {
            b.x = ballR;
            b.vx *= -1;
          }
          if (b.x > W - ballR) {
            b.x = W - ballR;
            b.vx *= -1;
          }
          if (b.y < ballR) {
            b.y = ballR;
            b.vy *= -1;
          }
          if (b.y > H) b.active = false;
          // block collision (point-in-cell)
          const col = Math.floor(b.x / cell);
          const row = Math.floor(b.y / cell);
          if (row >= 0 && row < grid.length && col >= 0 && col < COLS && grid[row][col] > 0) {
            grid[row][col]--;
            if (grid[row][col] === 0) {
              s.score++;
              onScore?.(s.score * 50);
            }
            b.vy *= -1;
            b.y += b.vy;
          }
        }
        if (s.queued === 0 && s.balls.every((b) => !b.active)) {
          s.balls = [];
          advance();
          if (isBot && !s.over) {
            // bot aims at the column with the most blocks
            const counts = Array(COLS).fill(0);
            grid.forEach((rw) => rw.forEach((h, c) => (counts[c] += h > 0 ? 1 : 0)));
            const col = counts.indexOf(Math.max(...counts));
            const tx = (col + 0.5) * cell;
            s.angle = Math.atan2(H * 0.4 - launchY, tx - launchX);
            setTimeout(() => {
              s.queued = BALLS;
              s.phase = 'fire';
            }, 400);
          }
        }
      } else if (s.phase === 'aim' && isBot && !s.over && !paused) {
        const counts = Array(COLS).fill(0);
        grid.forEach((rw) => rw.forEach((h, c) => (counts[c] += h > 0 ? 1 : 0)));
        const col = counts.indexOf(Math.max(...counts));
        const tx = (col + 0.5) * cell;
        s.angle = Math.atan2(H * 0.4 - launchY, tx - launchX);
        s.queued = BALLS;
        s.phase = 'fire';
      }

      // draw
      ctx.clearRect(0, 0, W, H);
      for (let r = 0; r < grid.length; r++)
        for (let c = 0; c < COLS; c++) {
          const h = grid[r][c];
          if (h <= 0) continue;
          ctx.fillStyle = blockColor(h);
          ctx.fillRect(c * cell + 2, r * cell + 2, cell - 4, cell - 4);
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.font = `bold ${cell * 0.34}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(h), c * cell + cell / 2, r * cell + cell / 2);
        }
      // launcher + aim line
      ctx.fillStyle = '#41d3bd';
      ctx.beginPath();
      ctx.arc(launchX, launchY, 8, 0, Math.PI * 2);
      ctx.fill();
      if (s.phase === 'aim') {
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(launchX, launchY);
        ctx.lineTo(launchX + Math.cos(s.angle) * 120, launchY + Math.sin(s.angle) * 120);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      for (const b of s.balls) {
        if (!b.active) continue;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, ballR, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [difficulty, isBot, paused, onDone, onScore, grid]);

  const aim = (e: React.PointerEvent) => {
    const s = st.current;
    if (isBot || s.phase !== 'aim') return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const lx = rect.width / 2;
    const ly = rect.height - 14;
    const ang = Math.atan2(e.clientY - rect.top - ly, e.clientX - rect.left - lx);
    s.angle = Math.max(-Math.PI + 0.3, Math.min(-0.3, ang));
  };
  const fire = () => {
    const s = st.current;
    if (isBot || s.phase !== 'aim') return;
    s.queued = BALLS;
    s.phase = 'fire';
  };

  return (
    <div className="board">
      <div className="hint">{isBot ? '🤖 breaking bricks…' : 'Drag to aim, release to fire your stream of balls'}</div>
      <canvas
        ref={canvasRef}
        className="cv-board"
        style={{ width: 'min(72cqmin, 92cqw, 380px)', height: 'min(80cqh, 560px)' }}
        onPointerDown={(e) => {
          st.current.aiming = true;
          aim(e);
        }}
        onPointerMove={(e) => st.current.aiming && aim(e)}
        onPointerUp={() => {
          st.current.aiming = false;
          fire();
        }}
        onPointerLeave={() => (st.current.aiming = false)}
      />
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: BrickBreakerSolo };
export default mod;
