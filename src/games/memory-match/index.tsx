import { useEffect, useRef, useState } from 'react';
import type { GameModule, TableGameProps } from '../../engine/types';
import { makeRng, randomSeed, botTickMs } from '../../engine/rng';
import { CARD_FACES, PAIRS, deal } from './logic';
import '../games.css';

const RECALL = { easy: 0.45, medium: 0.75, hard: 1 } as const;

function MemoryTable({ players, onGameOver }: TableGameProps) {
  const seats = players.slice(0, 2);
  const rng = useRef(makeRng(randomSeed())).current;
  const cards = useRef<number[]>(deal(rng, PAIRS)).current;
  const mem = useRef<Map<number, Set<number>>>(new Map());

  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [first, setFirst] = useState<number | null>(null);
  const [second, setSecond] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [turn, setTurn] = useState(0); // index into seats
  const [scores, setScores] = useState<number[]>([0, 0]);
  const evaluating = useRef(false);

  const cur = seats[turn];
  const isBotTurn = cur.kind === 'bot';

  const record = (i: number) => {
    const v = cards[i];
    if (!mem.current.has(v)) mem.current.set(v, new Set());
    mem.current.get(v)!.add(i);
  };

  const pick = (i: number) => {
    if (locked || matched.has(i) || i === first) return;
    record(i);
    if (first === null) setFirst(i);
    else if (second === null) setSecond(i);
  };
  const pickRef = useRef(pick);
  pickRef.current = pick;

  // Evaluate when two cards are face up.
  useEffect(() => {
    if (first === null || second === null || evaluating.current) return;
    evaluating.current = true;
    setLocked(true);
    const isMatch = cards[first] === cards[second];
    const t = setTimeout(() => {
      if (isMatch) {
        setMatched((m) => new Set(m).add(first).add(second));
        setScores((s) => s.map((v, idx) => (idx === turn ? v + 1 : v)));
      }
      setFirst(null);
      setSecond(null);
      setLocked(false);
      evaluating.current = false;
      if (!isMatch) setTurn((t2) => (t2 + 1) % seats.length);
    }, 820);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [first, second]);

  // Game over.
  useEffect(() => {
    if (matched.size === cards.length && cards.length > 0) {
      const t = setTimeout(() => {
        if (scores[0] === scores[1]) onGameOver(-1);
        else onGameOver(seats[scores[0] > scores[1] ? 0 : 1].seat);
      }, 500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched]);

  // Bot turn.
  useEffect(() => {
    if (!isBotTurn || locked || matched.size === cards.length) return;
    const recall = RECALL[cur.difficulty];
    const unmatched = cards.map((_, i) => i).filter((i) => !matched.has(i) && i !== first);

    const knownPartner = (val: number, exclude: number) => {
      const set = mem.current.get(val);
      if (!set) return null;
      for (const idx of set) if (idx !== exclude && !matched.has(idx)) return idx;
      return null;
    };

    const chooseFirst = (): number => {
      if (rng.float() < recall) {
        for (const [val, set] of mem.current) {
          const live = [...set].filter((i) => !matched.has(i));
          if (live.length >= 2 && cards[val] !== undefined) return live[0];
        }
      }
      return rng.pick(unmatched);
    };
    const chooseSecond = (): number => {
      const val = cards[first!];
      if (rng.float() < recall) {
        const p = knownPartner(val, first!);
        if (p != null) return p;
      }
      const rest = unmatched.filter((i) => i !== first);
      return rest.length ? rng.pick(rest) : unmatched[0];
    };

    const t = setTimeout(() => {
      if (first === null) pickRef.current(chooseFirst());
      else if (second === null) pickRef.current(chooseSecond());
    }, botTickMs[cur.difficulty]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBotTurn, first, second, locked, matched, turn]);

  const cols = 4;
  const size = `min(82cqmin, 84cqh, 460px)`;
  return (
    <div className="board">
      <div className="mm-scores">
        {seats.map((p, i) => (
          <div key={p.seat} className={`mm-score ${i === turn ? 'on' : ''}`} style={{ color: p.color }}>
            <span className="mm-name">
              {p.name}
              {p.kind === 'bot' ? ' 🤖' : ''}
            </span>
            <span className="mm-pts">{scores[i]}</span>
          </div>
        ))}
      </div>
      <div className="mm-grid" style={{ width: size, gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cards.map((face, i) => {
          const up = matched.has(i) || i === first || i === second;
          return (
            <button
              key={i}
              className={`mm-card ${up ? 'up' : ''} ${matched.has(i) ? 'matched' : ''}`}
              onClick={() => !isBotTurn && pick(i)}
              disabled={isBotTurn}
            >
              <span className="mm-face">{up ? CARD_FACES[face] : '?'}</span>
            </button>
          );
        })}
      </div>
      <div className="hint">{isBotTurn ? `${cur.name} is thinking…` : `${cur.name}, find a pair`}</div>
    </div>
  );
}

const mod: GameModule = { contest: 'table', Table: MemoryTable };
export default mod;
