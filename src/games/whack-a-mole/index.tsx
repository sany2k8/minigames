import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng } from '../../engine/rng';
import { sound } from '../../lib/sound';
import { DURATION_MS, HOLES, type Spawn, botReaction, schedule } from './logic';
import '../games.css';

interface Active {
  type: 'mole' | 'bomb';
  idx: number; // schedule index
  appear: number;
  expire: number;
}

function WhackAMoleSolo({ seed, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const rng = useRef(makeRng(seed)).current;
  const plan = useRef<Spawn[]>(schedule(rng, difficulty)).current;
  const [holes, setHoles] = useState<(Active | null)[]>(() => Array(HOLES).fill(null));
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  scoreRef.current = score;
  const [timeLeft, setTimeLeft] = useState(Math.ceil(DURATION_MS / 1000));
  const startRef = useRef(0);
  const ptr = useRef(0);
  const consumed = useRef<Set<number>>(new Set());
  const done = useRef(false);
  const reaction = useRef(botReaction(difficulty));

  const finish = (sc: number) => {
    if (done.current) return;
    done.current = true;
    onScore?.(sc);
    onDone({ solved: false, score: sc, timeMs: DURATION_MS });
  };

  useEffect(() => {
    startRef.current = performance.now();
    const id = setInterval(() => {
      if (paused || done.current) return;
      const elapsed = performance.now() - startRef.current;
      setTimeLeft(Math.max(0, Math.ceil((DURATION_MS - elapsed) / 1000)));
      if (elapsed >= DURATION_MS) {
        finish(scoreRef.current);
        clearInterval(id);
        return;
      }
      setHoles((prev) => {
        const next = prev.slice();
        // spawn due entries
        while (ptr.current < plan.length && plan[ptr.current].t <= elapsed) {
          const s = plan[ptr.current];
          if (!next[s.hole]) next[s.hole] = { type: s.type, idx: ptr.current, appear: s.t, expire: s.t + s.dur };
          ptr.current++;
        }
        // expire
        for (let h = 0; h < HOLES; h++) {
          const a = next[h];
          if (a && elapsed >= a.expire) next[h] = null;
        }
        // bot whacks moles after a reaction delay
        if (isBot) {
          for (let h = 0; h < HOLES; h++) {
            const a = next[h];
            if (a && a.type === 'mole' && !consumed.current.has(a.idx) && elapsed >= a.appear + reaction.current) {
              consumed.current.add(a.idx);
              setScore((sc) => {
                const ns = sc + 10;
                scoreRef.current = ns;
                onScore?.(ns);
                return ns;
              });
              next[h] = null;
            }
          }
        }
        return next;
      });
    }, 60);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, isBot]);

  const whack = (h: number) => {
    if (isBot || paused || done.current) return;
    const a = holes[h];
    if (!a || consumed.current.has(a.idx)) return;
    consumed.current.add(a.idx);
    if (a.type === 'mole') sound.pop();
    else sound.error();
    setScore((sc) => {
      const ns = sc + (a.type === 'mole' ? 10 : -15);
      scoreRef.current = ns;
      onScore?.(ns);
      return ns;
    });
    setHoles((prev) => {
      const next = prev.slice();
      next[h] = null;
      return next;
    });
  };

  const size = 'min(74cqmin, 64cqh, 380px)';
  return (
    <div className="board">
      <div className="board-info">
        <span>⏱ {timeLeft}s</span>
        <span>Score {score}</span>
      </div>
      <div className="wm-grid" style={{ width: size, height: size }}>
        {holes.map((a, h) => (
          <button key={h} className="wm-hole" onClick={() => whack(h)} disabled={isBot}>
            <span className="wm-dirt" />
            {a && <span className={`wm-pop ${a.type}`}>{a.type === 'mole' ? '🐹' : '💣'}</span>}
          </button>
        ))}
      </div>
      {!isBot && <div className="hint">Whack the moles 🐹 — avoid the bombs 💣!</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: WhackAMoleSolo };
export default mod;
