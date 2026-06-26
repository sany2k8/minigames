/**
 * Pure rules for Hangman. The secret word is chosen deterministically from the
 * seed so a race/score pairing is fair. The bot is a real deducer: it filters the
 * word list to candidates consistent with the revealed pattern + wrong guesses,
 * then guesses the most common remaining letter.
 */
export const MAX_MISSES = 6;

/** Offline word bank — common nouns, 4–8 letters, no proper nouns. */
export const WORDS = [
  'planet', 'rocket', 'guitar', 'window', 'garden', 'orange', 'silver', 'castle',
  'dragon', 'forest', 'island', 'jungle', 'monkey', 'pencil', 'pirate', 'puzzle',
  'rabbit', 'school', 'spider', 'summer', 'winter', 'turtle', 'violin', 'wizard',
  'anchor', 'basket', 'bridge', 'camera', 'candle', 'cheese', 'cookie', 'flower',
  'hammer', 'helmet', 'kitten', 'ladder', 'lizard', 'magnet', 'market', 'needle',
  'parrot', 'pillow', 'rocket', 'saddle', 'shadow', 'shield', 'singer', 'sketch',
  'tunnel', 'wallet', 'zipper', 'bottle', 'button', 'circle', 'dragon', 'engine',
  'apple', 'beach', 'cloud', 'crown', 'dance', 'eagle', 'flame', 'ghost', 'grape',
  'horse', 'jewel', 'lemon', 'mango', 'mouse', 'ocean', 'piano', 'queen', 'river',
  'robot', 'snake', 'storm', 'sugar', 'tiger', 'train', 'whale', 'zebra', 'bread',
  'sword', 'torch', 'crane', 'frost', 'maple', 'pearl'
];

export function wordForSeed(seed: number): string {
  return WORDS[seed % WORDS.length];
}

export const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

/** Letters in `word` not yet guessed (i.e. still hidden). */
export const missesUsed = (word: string, guessed: Set<string>) =>
  [...guessed].filter((ch) => !word.includes(ch)).length;

export const isWon = (word: string, guessed: Set<string>) =>
  [...word].every((ch) => guessed.has(ch));

export const isLost = (word: string, guessed: Set<string>) => missesUsed(word, guessed) >= MAX_MISSES;

export const maskOf = (word: string, guessed: Set<string>) =>
  [...word].map((ch) => (guessed.has(ch) ? ch : '_'));

/** Solved fast = more points; running out of guesses still pays a little. */
export function scoreFor(word: string, guessed: Set<string>): number {
  if (isWon(word, guessed)) return 200 + (MAX_MISSES - missesUsed(word, guessed)) * 50;
  return [...word].filter((ch) => guessed.has(ch)).length * 10;
}

/** Does candidate `w` match the known pattern and exclude all wrong letters? */
function consistent(w: string, word: string, guessed: Set<string>): boolean {
  if (w.length !== word.length) return false;
  for (let i = 0; i < w.length; i++) {
    const known = guessed.has(word[i]);
    if (known && w[i] !== word[i]) return false; // revealed letter must match position
    if (!known && guessed.has(w[i])) return false; // hidden slot can't be a guessed letter
  }
  return true;
}

/**
 * Bot guess: deduce from candidates matching the current board, otherwise fall
 * back to overall English letter frequency. Never repeats a guessed letter.
 */
export function botGuess(word: string, guessed: Set<string>): string {
  const candidates = WORDS.filter((w) => consistent(w, word, guessed));
  const freq: Record<string, number> = {};
  const pool = candidates.length ? candidates : WORDS;
  for (const w of pool)
    for (const ch of new Set(w)) if (!guessed.has(ch)) freq[ch] = (freq[ch] ?? 0) + 1;
  let best = '';
  let bestN = -1;
  for (const ch of ALPHABET) if ((freq[ch] ?? 0) > bestN) { bestN = freq[ch] ?? 0; best = ch; }
  // safety net: if every candidate letter is somehow guessed, pick any unguessed
  if (bestN <= 0) return ALPHABET.find((ch) => !guessed.has(ch)) ?? 'e';
  return best;
}
