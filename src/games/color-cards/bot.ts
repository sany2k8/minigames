import type { Difficulty } from '../../engine/types';
import { playableCards, type Card, type CardColor, type CCState } from './logic';

/** Picks a card to play, or null to draw. */
export function botPlay(s: CCState, difficulty: Difficulty): Card | null {
  const seat = s.current;
  const options = playableCards(s, seat);
  if (options.length === 0) return null;

  if (difficulty === 'easy') {
    return options[Math.floor(Math.random() * options.length)];
  }

  // medium/hard: prefer dumping high-value action cards, keep wilds for later.
  const value = (c: Card) => {
    if (c.kind === 'wild4') return difficulty === 'hard' ? 1 : 5;
    if (c.kind === 'wild') return difficulty === 'hard' ? 2 : 4;
    if (c.kind === 'draw2' || c.kind === 'skip' || c.kind === 'reverse') return 8;
    return 6 + (typeof c.kind === 'number' ? c.kind / 100 : 0);
  };
  return options.slice().sort((a, b) => value(b) - value(a))[0];
}

/** Chooses the color this bot holds the most of. */
export function botColor(s: CCState): CardColor {
  const seat = s.current;
  const counts: Record<string, number> = { red: 0, yellow: 0, green: 0, blue: 0 };
  for (const c of s.hands[seat]) if (c.color !== 'wild') counts[c.color]++;
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  return best as CardColor;
}
