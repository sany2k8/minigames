import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import {
  type Card,
  type Deal,
  RANKS,
  SUITS,
  adjacent,
  bestSequence,
  cardKey,
  cardsLeft,
  deal,
  isCleared,
  isRed,
  playablePiles
} from './logic';
import '../games.css';

const SCORE_PER_CARD = 100;
const CLEAR_BONUS = 4000;

function BlackHoleSolo({ seed, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const rng = useRef(makeRng(seed)).current;
  const start = useRef<Deal>(deal(rng)).current;
  const [piles, setPiles] = useState<Card[][]>(() => start.piles.map((p) => p.slice()));
  const [hole, setHole] = useState<Card>(start.hole);
  const startedAt = useRef(Date.now());
  const done = useRef(false);
  const botPlan = useRef<number[] | null>(null);
  const botStep = useRef(0);

  const left = cardsLeft(piles);
  const played = 51 - left;
  const playable = playablePiles(piles, hole);
  const stuck = playable.length === 0;

  useEffect(() => {
    onScore?.(played * SCORE_PER_CARD);
    if (done.current) return;
    if (isCleared(piles)) {
      done.current = true;
      onDone({
        solved: true,
        score: played * SCORE_PER_CARD + CLEAR_BONUS,
        timeMs: Date.now() - startedAt.current
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [piles]);

  const play = (pileIdx: number) => {
    const top = piles[pileIdx][piles[pileIdx].length - 1];
    if (!top || !adjacent(top.rank, hole.rank)) return;
    setHole(top);
    setPiles((ps) => ps.map((p, j) => (j === pileIdx ? p.slice(0, -1) : p)));
  };

  // Human finishes when no legal move remains.
  useEffect(() => {
    if (isBot || done.current || paused) return;
    if (stuck && !isCleared(piles)) {
      done.current = true;
      onDone({ solved: false, score: played * SCORE_PER_CARD, timeMs: Date.now() - startedAt.current });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stuck, isBot, paused]);

  // Bot replays a precomputed heuristic plan onto its own deal.
  useEffect(() => {
    if (!isBot || paused || done.current) return;
    if (!botPlan.current) botPlan.current = bestSequence(start);
    const plan = botPlan.current;
    const t = setTimeout(() => {
      if (botStep.current >= plan.length) {
        if (!done.current) {
          done.current = true;
          onDone({
            solved: isCleared(piles),
            score: played * SCORE_PER_CARD + (isCleared(piles) ? CLEAR_BONUS : 0),
            timeMs: Date.now() - startedAt.current
          });
        }
        return;
      }
      play(plan[botStep.current]);
      botStep.current += 1;
    }, botTickMs[difficulty]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [piles, isBot, paused, difficulty]);

  const tapPile = (i: number) => {
    if (isBot || paused || done.current) return;
    play(i);
  };

  const renderCard = (c: Card, faded = false) => (
    <span className={`bh-card ${isRed(c.suit) ? 'red' : 'black'} ${faded ? 'faded' : ''}`}>
      <b>{RANKS[c.rank]}</b>
      <i>{SUITS[c.suit]}</i>
    </span>
  );

  return (
    <div className="board bh">
      <div className="board-info">
        <span>Cleared {played}/51</span>
        <span>Score {played * SCORE_PER_CARD}</span>
      </div>

      <div className="bh-hole">
        <div className="bh-hole-ring">{renderCard(hole)}</div>
        <span className="bh-hole-label">Black Hole</span>
      </div>

      <div className="bh-piles">
        {piles.map((pile, i) => {
          const canPlay = playable.includes(i);
          return (
            <button
              key={i}
              className={`bh-pile ${canPlay ? 'ready' : ''} ${pile.length === 0 ? 'gone' : ''}`}
              onPointerDown={() => tapPile(i)}
              disabled={isBot || pile.length === 0}
            >
              {pile.map((c, j) => (
                <span
                  key={cardKey(c)}
                  className="bh-stack-slot"
                  style={{ ['--i' as string]: j }}
                >
                  {renderCard(c, j !== pile.length - 1)}
                </span>
              ))}
            </button>
          );
        })}
      </div>

      {!isBot && (
        <div className="hint">
          {stuck && !isCleared(piles)
            ? 'No moves left — round over'
            : 'Tap any glowing pile: its top card must be one rank above or below the black hole (A wraps K↔2)'}
        </div>
      )}
      {isBot && <div className="hint">🤖 swallowing cards… {played}/51</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: BlackHoleSolo };
export default mod;
