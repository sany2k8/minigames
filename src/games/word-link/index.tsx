import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import { BASE_WORDS, solutionsFor, wordScore } from '../word-finder/words';
import '../games.css';

function WordLinkSolo({ seed, isBot, difficulty, paused, onProgress, onScore, onDone }: SoloGameProps) {
  const rng = useRef(makeRng(seed)).current;
  const base = useRef(rng.pick(BASE_WORDS)).current;
  const letters = useRef(rng.shuffle(base.split(''))).current;
  const targets = useMemo(() => solutionsFor(letters.join('')), [letters]);
  const targetSet = useRef(new Set(targets)).current;

  const [found, setFound] = useState<string[]>([]);
  const [pick, setPick] = useState<number[]>([]); // indices into letters
  const [flash, setFlash] = useState<'ok' | 'no' | null>(null);
  const [score, setScore] = useState(0);
  const start = useRef(Date.now());
  const done = useRef(false);
  const botStep = useRef(0);
  const botOrder = useRef([...targets].sort((a, b) => a.length - b.length));

  const finish = (sc: number) => {
    if (done.current) return;
    done.current = true;
    onDone({ solved: found.length >= targets.length, score: sc, timeMs: Date.now() - start.current });
  };

  useEffect(() => {
    onProgress?.(targets.length ? Math.round((found.length / targets.length) * 100) : 0);
    if (!done.current && targets.length > 0 && found.length >= targets.length) finish(score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [found]);

  const submit = () => {
    if (isBot || paused || done.current || pick.length < 3) return;
    const word = pick.map((i) => letters[i]).join('');
    if (targetSet.has(word) && !found.includes(word)) {
      const ns = score + wordScore(word);
      setScore(ns);
      onScore?.(ns);
      setFound((f) => [...f, word]);
      setFlash('ok');
    } else {
      setFlash('no');
    }
    setPick([]);
    setTimeout(() => setFlash(null), 350);
  };

  // bot reveals words over time
  useEffect(() => {
    if (!isBot || paused || done.current) return;
    const t = setTimeout(() => {
      if (botStep.current >= botOrder.current.length) {
        finish(score);
        return;
      }
      const w = botOrder.current[botStep.current];
      botStep.current += 1;
      setFound((f) => [...f, w]);
      setScore((s) => {
        const ns = s + wordScore(w);
        onScore?.(ns);
        return ns;
      });
    }, botTickMs[difficulty] + 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [found, isBot, paused, difficulty]);

  const guess = pick.map((i) => letters[i].toUpperCase()).join('');

  return (
    <div className="board">
      <div className="board-info">
        <span>Found {found.length}/{targets.length}</span>
        <span>Score {score}</span>
      </div>

      {!isBot ? (
        <>
          <div className={`wl-guess ${flash ?? ''}`}>{guess || '· · ·'}</div>
          <div className="wl-wheel">
            {letters.map((ch, i) => (
              <button
                key={i}
                className={`wl-letter ${pick.includes(i) ? 'used' : ''}`}
                onClick={() => setPick((p) => (p.includes(i) ? p : [...p, i]))}
                disabled={paused || done.current}
              >
                {ch.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="board-actions">
            <button className="btn btn-ghost" onClick={() => setPick([])}>Clear</button>
            <button className="btn btn-primary" onClick={submit} disabled={pick.length < 3}>Enter</button>
          </div>
          <div className="wl-found">
            {found.map((w) => (
              <span key={w} className="wl-chip">{w}</span>
            ))}
          </div>
          <div className="hint">Tap letters to spell a word (3+ letters), then Enter. Find them all!</div>
        </>
      ) : (
        <>
          <div className="wl-wheel">
            {letters.map((ch, i) => (
              <span key={i} className="wl-letter">{ch.toUpperCase()}</span>
            ))}
          </div>
          <div className="wl-found">
            {found.map((w) => (
              <span key={w} className="wl-chip">{w}</span>
            ))}
          </div>
          <div className="hint">🤖 linking letters…</div>
        </>
      )}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: WordLinkSolo };
export default mod;
