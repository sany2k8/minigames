import { useEffect, useRef } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng } from '../../engine/rng';
import '../games.css';

interface Block {
  x: number; // left, px
  w: number; // width, px
}

function StackJumpSolo({ seed, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rng = useRef(makeRng(seed)).current;
  const st = useRef({
    stack: [] as Block[],
    cur: null as Block | null,
    dir: 1,
    speed: 2.6,
    score: 0,
    over: false,
    init: false
  });
  const placeRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    let last = performance.now();
    const BH = 26; // block height
    const baseSpeed = difficulty === 'hard' ? 4 : difficulty === 'medium' ? 3.2 : 2.4;

    const finish = () => {
      if (st.current.over) return;
      st.current.over = true;
      onDone({ solved: false, score: st.current.score, timeMs: 0 });
    };

    const place = () => {
      const s = st.current;
      if (s.over || !s.cur) return;
      const below = s.stack[s.stack.length - 1];
      const overlapL = Math.max(s.cur.x, below.x);
      const overlapR = Math.min(s.cur.x + s.cur.w, below.x + below.w);
      const ov = overlapR - overlapL;
      if (ov <= 0) {
        finish();
        return;
      }
      const placed: Block = { x: overlapL, w: ov };
      s.stack.push(placed);
      s.score++;
      onScore?.(s.score);
      s.speed = baseSpeed + s.score * 0.12;
      // next moving block starts from a side
      s.dir = rng.float() < 0.5 ? 1 : -1;
      const W = canvas.clientWidth;
      s.cur = { x: s.dir > 0 ? 0 : W - placed.w, w: placed.w };
    };
    placeRef.current = place;

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

      if (!s.init) {
        s.init = true;
        s.speed = baseSpeed;
        const w0 = W * 0.5;
        s.stack = [{ x: (W - w0) / 2, w: w0 }];
        s.cur = { x: 0, w: w0 };
        s.dir = 1;
      }

      if (!paused && !s.over && s.cur) {
        s.cur.x += s.dir * s.speed * (dt / 16);
        if (s.cur.x <= 0) {
          s.cur.x = 0;
          s.dir = 1;
        }
        if (s.cur.x + s.cur.w >= W) {
          s.cur.x = W - s.cur.w;
          s.dir = -1;
        }
        // bot: place when aligned with the block below
        if (isBot) {
          const below = s.stack[s.stack.length - 1];
          if (Math.abs(s.cur.x - below.x) < 4) placeRef.current();
        }
      }

      // draw
      ctx.clearRect(0, 0, W, Hh);
      const topIdx = s.stack.length;
      for (let i = 0; i < s.stack.length; i++) {
        const fromTop = topIdx - i;
        const y = Hh - 80 - fromTop * BH;
        if (y < -BH || y > Hh) continue;
        const b = s.stack[i];
        const hue = (i * 18) % 360;
        ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
        ctx.fillRect(b.x, y, b.w, BH - 2);
      }
      // moving block
      if (s.cur && !s.over) {
        const y = Hh - 80 - (topIdx + 1) * BH + BH;
        ctx.fillStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 14;
        ctx.fillRect(s.cur.x, y, s.cur.w, BH - 2);
        ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [difficulty, isBot, paused, onDone, onScore, rng]);

  return (
    <div className="board kh" onClick={() => !isBot && placeRef.current()}>
      <div className="board-info">
        <span id="sj-score">Tap to drop</span>
      </div>
      <canvas
        ref={canvasRef}
        className="cv-board"
        style={{ width: 'min(70cqmin, 92cqw, 380px)', height: 'min(82cqh, 600px)' }}
      />
      {!isBot && <div className="hint">Tap anywhere to drop the block — stack it as tall as you can!</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: StackJumpSolo };
export default mod;
