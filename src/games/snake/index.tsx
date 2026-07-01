import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng } from '../../engine/rng';
import { sound } from '../../lib/sound';
import { N, type Dir, type SnakeState, botDir, initState, step } from './logic';
import '../games.css';

const SPEED: Record<'easy' | 'medium' | 'hard', number> = { easy: 200, medium: 140, hard: 95 };

function SnakeSolo({ seed, player, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const rng = useRef(makeRng(seed)).current;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const state = useRef<SnakeState>(initState(rng));
  const nextDir = useRef<Dir>('R');
  const [score, setScore] = useState(0);
  const startedAt = useRef(Date.now());
  const done = useRef(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone({ solved: false, score: state.current.score, timeMs: Date.now() - startedAt.current });
  };

  // game tick
  useEffect(() => {
    const id = setInterval(() => {
      if (pausedRef.current || done.current) return;
      const dir = isBot ? botDir(state.current) : nextDir.current;
      const ns = step(state.current, dir, rng);
      state.current = ns;
      if (ns.score !== score) {
        if (!isBot) sound.coin();
        setScore(ns.score);
        onScore?.(ns.score);
      }
      if (ns.dead) {
        if (!isBot) sound.hit();
        finish();
      }
    }, SPEED[difficulty]);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, isBot]);

  // draw loop
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const accent = player.color;
    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      if (canvas.width !== Math.round(W * dpr)) {
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cell = W / N;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(0, 0, W, H);
      const s = state.current;
      // food
      ctx.fillStyle = '#ff5d73';
      ctx.beginPath();
      ctx.arc((s.food.x + 0.5) * cell, (s.food.y + 0.5) * cell, cell * 0.32, 0, Math.PI * 2);
      ctx.fill();
      // snake
      s.snake.forEach((p, i) => {
        ctx.fillStyle = i === 0 ? '#fff' : accent;
        const pad = i === 0 ? 0.12 : 0.16;
        const r = cell * 0.22;
        const x = p.x * cell + cell * pad;
        const y = p.y * cell + cell * pad;
        const w = cell * (1 - pad * 2);
        ctx.beginPath();
        ctx.roundRect(x, y, w, w, r);
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [player.color]);

  // input
  useEffect(() => {
    if (isBot) return;
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R',
        w: 'U', s: 'D', a: 'L', d: 'R'
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        nextDir.current = dir;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isBot]);

  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onDown = (e: React.PointerEvent) => (swipe.current = { x: e.clientX, y: e.clientY });
  const onUp = (e: React.PointerEvent) => {
    if (isBot || !swipe.current) return;
    const dx = e.clientX - swipe.current.x;
    const dy = e.clientY - swipe.current.y;
    swipe.current = null;
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
    nextDir.current = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : dy > 0 ? 'D' : 'U';
  };

  const size = 'min(82cqmin, 80cqh, 420px)';
  return (
    <div className="board">
      <div className="board-info">
        <span>Score {score}</span>
        <span>Length {state.current.snake.length}</span>
      </div>
      <canvas
        ref={canvasRef}
        className="cv-board"
        style={{ width: size, height: size, touchAction: 'none' }}
        onPointerDown={onDown}
        onPointerUp={onUp}
      />
      {!isBot && <div className="hint">Swipe or use arrow keys. Eat food, dodge the walls and your tail.</div>}
      {isBot && <div className="hint">🤖 slithering for food…</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: SnakeSolo };
export default mod;
