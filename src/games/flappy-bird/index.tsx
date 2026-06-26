import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng } from '../../engine/rng';
import { HowToPlay } from '../HowToPlay';
import { FlappyBirdIcon } from '../icons';
import {
  BIRD_R,
  BIRD_X,
  PIPE_HALF_W,
  type Pipe,
  TUNING,
  botShouldFlap,
  hitsGround,
  hitsPipe,
  nextGap,
  scoreFor
} from './logic';
import '../games.css';

function FlappyBirdSolo({ seed, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(isBot); // bot starts immediately; human reads the rules first
  const rng = useRef(makeRng(seed)).current;
  const st = useRef({
    y: 0.5,
    vel: 0,
    pipes: [] as Pipe[],
    score: 0,
    started: false,
    over: false,
    wingT: 0
  });
  // flap is read inside the rAF loop; expose via a ref the handler can set
  const flapReq = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const tune = TUNING[difficulty];
    let raf = 0;
    let last = performance.now();

    // seed the first couple of pipes
    st.current.pipes = [];
    let nextX = 1.0;
    for (let i = 0; i < 3; i++) {
      st.current.pipes.push({ x: nextX, gapY: nextGap(rng, tune.gap), passed: false });
      nextX += tune.spacing;
    }

    const finish = () => {
      if (st.current.over) return;
      st.current.over = true;
      onDone({ solved: false, score: scoreFor(st.current.score), timeMs: 0 });
    };

    const loop = (now: number) => {
      const s = st.current;
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      if (canvas.width !== Math.round(W * dpr)) {
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const aspect = W / H;

      if (!paused && !s.over && s.started) {
        // bot input
        if (isBot) {
          const ahead = s.pipes.filter((p) => p.x > BIRD_X - PIPE_HALF_W).sort((a, b) => a.x - b.x)[0];
          const target = ahead ? ahead.gapY : 0.5;
          if (botShouldFlap(s.y, s.vel, target) && s.vel > -0.2) flapReq.current = true;
        }
        if (flapReq.current) {
          s.vel = tune.flap;
          s.wingT = 1;
          flapReq.current = false;
        }
        s.vel += tune.gravity * dt;
        s.y += s.vel * dt;
        s.wingT = Math.max(0, s.wingT - dt * 4);
        // scroll pipes
        for (const p of s.pipes) {
          p.x -= tune.speed * dt;
          if (!p.passed && p.x < BIRD_X) {
            p.passed = true;
            s.score += 1;
            onScore?.(scoreFor(s.score));
          }
        }
        // recycle off-screen pipes to the right
        s.pipes = s.pipes.filter((p) => p.x > -PIPE_HALF_W * 2);
        const rightmost = s.pipes.reduce((mx, p) => Math.max(mx, p.x), 0);
        while (s.pipes.length < 4) {
          const nx = rightmost + tune.spacing * (4 - s.pipes.length);
          s.pipes.push({ x: nx, gapY: nextGap(rng, tune.gap), passed: false });
        }
        // collisions
        if (hitsGround(s.y)) { s.y = Math.max(BIRD_R, Math.min(1 - BIRD_R, s.y)); finish(); }
        for (const p of s.pipes) if (hitsPipe(s.y, p, tune.gap, aspect)) finish();
      }

      // ---- draw ----
      ctx.clearRect(0, 0, W, H);
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#1b2a4a');
      sky.addColorStop(1, '#0d1530');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      // pipes
      const pw = PIPE_HALF_W * W;
      for (const p of s.pipes) {
        const cx = p.x * W;
        const gTop = (p.gapY - tune.gap) * H;
        const gBot = (p.gapY + tune.gap) * H;
        ctx.fillStyle = '#51e08a';
        ctx.shadowColor = '#51e08a';
        ctx.shadowBlur = 10;
        ctx.fillRect(cx - pw, 0, pw * 2, gTop);
        ctx.fillRect(cx - pw, gBot, pw * 2, H - gBot);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#3fb874';
        ctx.fillRect(cx - pw - 3, gTop - 14, pw * 2 + 6, 14);
        ctx.fillRect(cx - pw - 3, gBot, pw * 2 + 6, 14);
      }
      // bird
      const bx = BIRD_X * W;
      const by = s.y * H;
      const br = BIRD_R * H;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(Math.max(-0.5, Math.min(0.9, s.vel * 0.8)));
      ctx.fillStyle = '#ffd166';
      ctx.shadowColor = '#ffd166';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, br, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // wing
      ctx.fillStyle = '#f3a93f';
      ctx.beginPath();
      ctx.ellipse(-br * 0.2, s.wingT > 0.5 ? br * 0.3 : -br * 0.2, br * 0.6, br * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      // eye + beak
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(br * 0.35, -br * 0.25, br * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(br * 0.45, -br * 0.25, br * 0.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff8c42';
      ctx.beginPath();
      ctx.moveTo(br * 0.7, 0);
      ctx.lineTo(br * 1.3, br * 0.15);
      ctx.lineTo(br * 0.7, br * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      if (!s.started && !isBot) {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = `700 ${Math.round(W * 0.05)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('Tap to start', W / 2, H * 0.4);
      }
      ctx.fillStyle = '#fff';
      ctx.font = `800 ${Math.round(W * 0.09)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(String(s.score), W / 2, H * 0.14);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [difficulty, isBot, paused, onDone, onScore, rng]);

  const flap = () => {
    if (st.current.over || paused) return;
    st.current.started = true;
    if (!isBot) flapReq.current = true;
  };

  // spacebar / arrow-up for desktop
  useEffect(() => {
    if (isBot) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBot, paused]);

  // bot auto-starts
  useEffect(() => {
    if (isBot && !paused) st.current.started = true;
  }, [isBot, paused]);

  return (
    <div className="board">
      <div className="hint">{isBot ? '🐤 the bot is flapping…' : 'Tap / Space to flap through the pipes'}</div>
      <canvas
        ref={canvasRef}
        className="cv-board"
        style={{ width: 'min(64cqmin, 92cqw, 380px)', height: 'min(82cqh, 620px)', touchAction: 'none' }}
        onPointerDown={(e) => {
          e.preventDefault();
          flap();
        }}
      />
      {!ready && (
        <HowToPlay
          title="Flappy Bird"
          tagline="One tap is all it takes."
          icon={<FlappyBirdIcon />}
          accent="#ffd166"
          accent2="#1d4f3a"
          onStart={() => setReady(true)}
          steps={[
            { icon: '👆', text: 'Tap the screen (or press Space) to flap the bird upward.' },
            { icon: '🟢', text: 'Glide through the gaps between the pipes — don’t hit a pipe or the ground.' },
            { icon: '🏆', text: 'Every pipe you clear scores a point. The bird hovers until your first tap, so take your time.' }
          ]}
        />
      )}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: FlappyBirdSolo };
export default mod;
