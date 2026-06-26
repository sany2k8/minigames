import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { botTickMs } from '../../engine/rng';
import { HowToPlay } from '../HowToPlay';
import { HangmanIcon } from '../icons';
import {
  ALPHABET,
  MAX_MISSES,
  botGuess,
  isLost,
  isWon,
  maskOf,
  missesUsed,
  scoreFor,
  wordForSeed
} from './logic';
import '../games.css';

/** The classic gallows, drawn part-by-part as misses accrue (0..6 parts). */
function Gallows({ misses }: { misses: number }) {
  return (
    <svg className="hm-gallows" viewBox="0 0 120 140" aria-hidden>
      {/* scaffold (always shown) */}
      <line x1="10" y1="135" x2="80" y2="135" />
      <line x1="30" y1="135" x2="30" y2="10" />
      <line x1="30" y1="10" x2="85" y2="10" />
      <line x1="85" y1="10" x2="85" y2="28" />
      {/* body parts revealed with each miss */}
      {misses > 0 && <circle className="hm-part" cx="85" cy="40" r="12" />}
      {misses > 1 && <line className="hm-part" x1="85" y1="52" x2="85" y2="95" />}
      {misses > 2 && <line className="hm-part" x1="85" y1="62" x2="68" y2="78" />}
      {misses > 3 && <line className="hm-part" x1="85" y1="62" x2="102" y2="78" />}
      {misses > 4 && <line className="hm-part" x1="85" y1="95" x2="70" y2="118" />}
      {misses > 5 && <line className="hm-part" x1="85" y1="95" x2="100" y2="118" />}
    </svg>
  );
}

function HangmanSolo({ seed, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const word = useRef(wordForSeed(seed)).current;
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(isBot);
  const start = useRef(Date.now());
  const done = useRef(false);

  const won = isWon(word, guessed);
  const lost = isLost(word, guessed);
  const misses = missesUsed(word, guessed);

  useEffect(() => {
    onScore?.(scoreFor(word, guessed));
    if (!done.current && (won || lost)) {
      done.current = true;
      setTimeout(
        () => onDone({ solved: won, score: scoreFor(word, guessed), timeMs: Date.now() - start.current }),
        500
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guessed]);

  const guess = (ch: string) => {
    if (!ready || done.current || paused || guessed.has(ch)) return;
    setGuessed((g) => new Set(g).add(ch));
  };
  const guessRef = useRef(guess);
  guessRef.current = guess;

  // physical keyboard for humans
  useEffect(() => {
    if (isBot) return;
    const onKey = (e: KeyboardEvent) => {
      if (/^[a-zA-Z]$/.test(e.key)) guessRef.current(e.key.toLowerCase());
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isBot]);

  // bot deducer
  useEffect(() => {
    if (!ready || !isBot || paused || done.current || won || lost) return;
    const t = setTimeout(() => guessRef.current(botGuess(word, guessed)), botTickMs[difficulty] + 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guessed, isBot, paused, difficulty, ready]);

  const mask = maskOf(word, guessed);

  return (
    <div className="board hm">
      <div className="board-info">
        <span>Misses {misses}/{MAX_MISSES}</span>
        <span>Score {scoreFor(word, guessed)}</span>
      </div>
      <Gallows misses={misses} />
      <div className="hm-word">
        {mask.map((ch, i) => (
          <span key={i} className={`hm-slot ${ch !== '_' ? 'on' : ''}`}>
            {ch !== '_' ? ch.toUpperCase() : ''}
          </span>
        ))}
      </div>
      {won && <div className="hm-msg ok">Solved! 🎉</div>}
      {lost && <div className="hm-msg bad">The word was “{word.toUpperCase()}”</div>}
      {!isBot ? (
        <div className="hm-keys">
          {ALPHABET.map((ch) => {
            const used = guessed.has(ch);
            const wrong = used && !word.includes(ch);
            return (
              <button
                key={ch}
                className={`hm-key ${used ? (wrong ? 'wrong' : 'right') : ''}`}
                disabled={used || won || lost}
                onClick={() => guess(ch)}
              >
                {ch.toUpperCase()}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="hint">🤖 deducing… {misses}/{MAX_MISSES} misses</div>
      )}
      {!ready && (
        <HowToPlay
          title="Hangman"
          tagline="Guess the hidden word."
          icon={<HangmanIcon />}
          accent="#ff8c42"
          accent2="#5e3a1d"
          onStart={() => {
            start.current = Date.now();
            setReady(true);
          }}
          steps={[
            { icon: '🔤', text: 'Tap letters to guess the letters in the hidden word.' },
            { icon: '❌', text: `Each wrong letter draws another part of the figure — ${MAX_MISSES} misses and it’s game over.` },
            { icon: '💡', text: 'Solve the word with guesses to spare for a higher score.' }
          ]}
        />
      )}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: HangmanSolo };
export default mod;
