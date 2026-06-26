import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng } from '../../engine/rng';
import { TARGET, THROW_ANGLE, collides, normalize, speedFor, thresholdFor } from './logic';
import '../games.css';

function KnifeHitSolo({ seed, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const rng = useRef(makeRng(seed)).current;
  const threshold = useRef(thresholdFor(difficulty)).current;
  const [knives, setKnives] = useState<number[]>([]);
  const [rotation, setRotation] = useState(0);
  const [hitFlash, setHitFlash] = useState(false);
  const rotRef = useRef(0);
  const speedRef = useRef(speedFor(rng, 0, difficulty));
  const knivesRef = useRef<number[]>([]);
  const done = useRef(false);
  const start = useRef(Date.now());
  const botCooldown = useRef(0);

  const finish = (won: boolean) => {
    if (done.current) return;
    done.current = true;
    const landed = knivesRef.current.length;
    const score = landed * 100 + (won ? 1000 : 0);
    onScore?.(score);
    onDone({ solved: won, score, timeMs: Date.now() - start.current });
  };

  const throwKnife = () => {
    if (done.current || paused) return;
    const rel = normalize(THROW_ANGLE - rotRef.current);
    if (collides(knivesRef.current, rel, threshold)) {
      setHitFlash(true);
      setTimeout(() => finish(false), 350);
      return;
    }
    const next = [...knivesRef.current, rel];
    knivesRef.current = next;
    setKnives(next);
    onScore?.(next.length * 100);
    // speed up each "stage" of a few knives
    speedRef.current = speedFor(rng, Math.floor(next.length / 3), difficulty);
    if (next.length >= TARGET) finish(true);
  };
  const throwRef = useRef(throwKnife);
  throwRef.current = throwKnife;

  // animation loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      if (!paused && !done.current) {
        rotRef.current = normalize(rotRef.current + speedRef.current * dt);
        setRotation(rotRef.current);
        if (isBot) {
          botCooldown.current -= dt;
          if (botCooldown.current <= 0) {
            const rel = normalize(THROW_ANGLE - rotRef.current);
            const safe = !collides(knivesRef.current, rel, threshold + 6);
            if (safe) {
              throwRef.current();
              botCooldown.current = difficulty === 'hard' ? 360 : difficulty === 'medium' ? 520 : 720;
            }
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isBot, paused, difficulty, threshold]);

  const size = 'min(64cqmin, 60cqh, 320px)';
  return (
    <div className="board kh" onClick={() => !isBot && throwKnife()}>
      <div className="board-info">
        <span>Knives {knives.length}/{TARGET}</span>
      </div>
      <div className="kh-stage" style={{ width: size, height: size }}>
        <div className={`kh-log ${hitFlash ? 'hit' : ''}`} style={{ transform: `rotate(${rotation}deg)` }}>
          <div className="kh-log-face">🪵</div>
          {knives.map((a, i) => (
            <div key={i} className="kh-knife stuck" style={{ transform: `rotate(${a}deg) translateY(50%)` }}>
              🔪
            </div>
          ))}
        </div>
        <div className="kh-incoming">🔪</div>
      </div>
      {!isBot && <div className="hint">Tap anywhere to throw — don't hit a stuck knife!</div>}
      {isBot && <div className="hint">🤖 throwing… {knives.length}/{TARGET}</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: KnifeHitSolo };
export default mod;
