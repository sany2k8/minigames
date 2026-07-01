import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng } from '../../engine/rng';
import { sound } from '../../lib/sound';
import { PADS, botMistakeChance, makeSequence } from './logic';
import '../games.css';

function SimonSaysSolo({ seed, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const rng = useRef(makeRng(seed)).current;
  const seq = useRef<number[]>(makeSequence(rng)).current;
  const botRng = useRef(makeRng(seed ^ 0x55)).current;
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<'show' | 'input'>('show');
  const [active, setActive] = useState<number | null>(null);
  const inputIdx = useRef(0);
  const done = useRef(false);

  const finish = (completed: number) => {
    if (done.current) return;
    done.current = true;
    onScore?.(completed * 100);
    onDone({ solved: false, score: completed * 100, timeMs: 0 });
  };

  // playback of the sequence prefix
  useEffect(() => {
    if (phase !== 'show' || paused || done.current) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const step = 620;
    for (let i = 0; i < round; i++) {
      timers.push(
        setTimeout(() => {
          setActive(seq[i]);
          sound.pad(seq[i]);
        }, i * step)
      );
      timers.push(setTimeout(() => setActive(null), i * step + 380));
    }
    timers.push(
      setTimeout(() => {
        inputIdx.current = 0;
        setPhase('input');
      }, round * step + 220)
    );
    return () => timers.forEach(clearTimeout);
  }, [phase, round, paused, seq]);

  // bot "plays" the input phase
  useEffect(() => {
    if (phase !== 'input' || !isBot || paused || done.current) return;
    const t = setTimeout(() => {
      if (botRng.float() < botMistakeChance(round, difficulty)) finish(round - 1);
      else {
        onScore?.(round * 100);
        setRound((r) => r + 1);
        setPhase('show');
      }
    }, round * 260 + 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isBot, round, paused, difficulty]);

  const tap = (pad: number) => {
    if (isBot || phase !== 'input' || paused || done.current) return;
    setActive(pad);
    setTimeout(() => setActive(null), 160);
    if (pad === seq[inputIdx.current]) {
      sound.pad(pad);
      inputIdx.current++;
      if (inputIdx.current === round) {
        onScore?.(round * 100);
        setRound((r) => r + 1);
        setPhase('show');
      }
    } else {
      sound.error();
      finish(round - 1);
    }
  };

  const size = 'min(70cqmin, 64cqh, 340px)';
  return (
    <div className="board">
      <div className="board-info">
        <span>Round {round}</span>
        <span>{phase === 'show' ? 'Watch…' : isBot ? 'Bot repeating…' : 'Your turn'}</span>
      </div>
      <div className="sm-pads" style={{ width: size, height: size }}>
        {PADS.map((color, i) => (
          <button
            key={i}
            className={`sm-pad ${active === i ? 'on' : ''}`}
            style={{ background: color }}
            onClick={() => tap(i)}
            disabled={isBot || phase !== 'input'}
          />
        ))}
        <div className="sm-center">{round}</div>
      </div>
      {!isBot && <div className="hint">Watch the flashes, then repeat the sequence</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: SimonSaysSolo };
export default mod;
