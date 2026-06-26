import { WORDS } from './words';

export type Mark = 'correct' | 'present' | 'absent';
export const MAX_ROWS = 6;
export const WORD_LEN = 5;

/** Wordle scoring with correct duplicate-letter handling. */
export function evaluate(guess: string, answer: string): Mark[] {
  const res: Mark[] = Array(WORD_LEN).fill('absent');
  const counts: Record<string, number> = {};
  for (const ch of answer) counts[ch] = (counts[ch] ?? 0) + 1;
  for (let i = 0; i < WORD_LEN; i++) {
    if (guess[i] === answer[i]) {
      res[i] = 'correct';
      counts[guess[i]]--;
    }
  }
  for (let i = 0; i < WORD_LEN; i++) {
    if (res[i] === 'correct') continue;
    if (counts[guess[i]] > 0) {
      res[i] = 'present';
      counts[guess[i]]--;
    }
  }
  return res;
}

const sameMarks = (a: Mark[], b: Mark[]) => a.every((m, i) => m === b[i]);

/** Bot solver: filter candidates consistent with all feedback so far. */
export function botGuess(history: { guess: string; marks: Mark[] }[]): string {
  if (history.length === 0) return 'crane';
  const candidates = WORDS.filter((w) =>
    history.every((h) => sameMarks(evaluate(h.guess, w), h.marks))
  );
  if (candidates.length === 0) return WORDS[Math.floor(Math.random() * WORDS.length)];
  return candidates[Math.floor(Math.random() * Math.min(candidates.length, 3))];
}

export function secretForSeed(seed: number): string {
  return WORDS[seed % WORDS.length];
}

/** Higher is better: solve fast = more points; fail = small score. */
export function scoreFor(solved: boolean, attempts: number): number {
  return solved ? (MAX_ROWS - attempts + 1) * 100 : 40;
}
