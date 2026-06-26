import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { botTickMs } from '../../engine/rng';
import { MAX_ROWS, type Mark, WORD_LEN, botGuess, evaluate, scoreFor, secretForSeed } from './logic';
import { WORD_SET } from './words';
import '../games.css';

const KEYS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

function WordleSolo({ seed, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const secret = useRef(secretForSeed(seed)).current;
  const [rows, setRows] = useState<{ guess: string; marks: Mark[] }[]>([]);
  const [input, setInput] = useState('');
  const [shake, setShake] = useState(false);
  const start = useRef(Date.now());
  const done = useRef(false);

  const finish = (solved: boolean, attempts: number) => {
    if (done.current) return;
    done.current = true;
    const sc = scoreFor(solved, attempts);
    onScore?.(sc);
    onDone({ solved, score: sc, timeMs: Date.now() - start.current });
  };

  const submit = (word: string) => {
    if (done.current) return;
    if (word.length !== WORD_LEN || !WORD_SET.has(word)) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    const marks = evaluate(word, secret);
    const next = [...rows, { guess: word, marks }];
    setRows(next);
    setInput('');
    if (word === secret) finish(true, next.length);
    else if (next.length >= MAX_ROWS) finish(false, next.length);
  };
  const submitRef = useRef(submit);
  submitRef.current = submit;

  // physical keyboard
  useEffect(() => {
    if (isBot) return;
    const onKey = (e: KeyboardEvent) => {
      if (done.current || paused) return;
      if (e.key === 'Enter') submitRef.current(input);
      else if (e.key === 'Backspace') setInput((s) => s.slice(0, -1));
      else if (/^[a-zA-Z]$/.test(e.key)) setInput((s) => (s.length < WORD_LEN ? s + e.key.toLowerCase() : s));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [input, isBot, paused]);

  // bot solver
  useEffect(() => {
    if (!isBot || paused || done.current) return;
    const t = setTimeout(() => submitRef.current(botGuess(rows)), botTickMs[difficulty] + 400);
    return () => clearTimeout(t);
  }, [rows, isBot, paused, difficulty]);

  const tap = (ch: string) => {
    if (isBot || done.current) return;
    if (ch === 'enter') submit(input);
    else if (ch === 'back') setInput((s) => s.slice(0, -1));
    else setInput((s) => (s.length < WORD_LEN ? s + ch : s));
  };

  // keyboard letter colouring
  const keyState: Record<string, Mark> = {};
  const rank: Record<Mark, number> = { absent: 0, present: 1, correct: 2 };
  for (const r of rows)
    r.guess.split('').forEach((ch, i) => {
      if (!keyState[ch] || rank[r.marks[i]] > rank[keyState[ch]]) keyState[ch] = r.marks[i];
    });

  return (
    <div className="board wd">
      <div className="wd-grid">
        {Array.from({ length: MAX_ROWS }).map((_, r) => {
          const past = rows[r];
          const isCurrent = r === rows.length;
          return (
            <div key={r} className={`wd-row ${isCurrent && shake ? 'shake' : ''}`}>
              {Array.from({ length: WORD_LEN }).map((_, c) => {
                const ch = past ? past.guess[c] : isCurrent ? input[c] : '';
                const mark = past ? past.marks[c] : undefined;
                return (
                  <div key={c} className={`wd-tile ${mark ?? ''} ${ch && !mark ? 'filled' : ''}`}>
                    {ch?.toUpperCase() ?? ''}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {!isBot ? (
        <div className="wd-keys">
          {KEYS.map((row, ri) => (
            <div key={ri} className="wd-krow">
              {ri === 2 && <button className="wd-key wide" onClick={() => tap('enter')}>↵</button>}
              {row.split('').map((ch) => (
                <button key={ch} className={`wd-key ${keyState[ch] ?? ''}`} onClick={() => tap(ch)}>
                  {ch.toUpperCase()}
                </button>
              ))}
              {ri === 2 && <button className="wd-key wide" onClick={() => tap('back')}>⌫</button>}
            </div>
          ))}
        </div>
      ) : (
        <div className="hint">🤖 solving… {rows.length}/{MAX_ROWS} guesses</div>
      )}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: WordleSolo };
export default mod;
