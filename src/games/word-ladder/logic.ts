/**
 * Word Ladder — change one letter at a time, each step a real word, to morph the
 * start word into the target. A bundled, fully-offline 4-letter word set with
 * rich connectivity powers the puzzle; pairs are pre-chosen to be solvable. Both
 * racers get the same start/target from the seed.
 */

export const WORDS: string[] = [
  'cold', 'cord', 'card', 'ward', 'warm', 'word', 'wore', 'core', 'bore', 'bone',
  'bane', 'band', 'bend', 'bond', 'fond', 'find', 'fine', 'wine', 'vine', 'dine',
  'dime', 'time', 'tile', 'tale', 'tall', 'ball', 'bell', 'belt', 'best', 'rest',
  'rust', 'ruse', 'rose', 'nose', 'note', 'node', 'code', 'mode', 'made', 'mare',
  'hare', 'haze', 'maze', 'mace', 'race', 'rice', 'ride', 'rude', 'rule', 'role',
  'hole', 'hold', 'held', 'herd', 'hard', 'harm', 'farm', 'form', 'fort', 'sort',
  'sore', 'sire', 'site', 'bite', 'bile', 'mile', 'mild', 'mind', 'mine', 'mane',
  'cane', 'came', 'come', 'dome', 'dose', 'dote', 'date', 'gate', 'gaze', 'gale',
  'male', 'pale', 'pile', 'pine', 'pint', 'mint', 'mist', 'most', 'mast', 'cast',
  'case', 'base', 'bass', 'lass', 'last', 'list', 'fist', 'fish', 'wish', 'wash',
  'cash', 'dash', 'dish', 'disk', 'dusk', 'desk', 'deck', 'dock', 'lock', 'lick',
  'lice', 'life', 'like', 'lake', 'cake', 'bake', 'bare', 'fare', 'face', 'fact',
  'fast', 'fade', 'wade', 'wane', 'lane', 'line', 'lime', 'life', 'love', 'live',
  'hive', 'have', 'gave', 'cave', 'cove', 'code', 'cope', 'rope', 'ripe', 'rile'
];

export const WORD_SET = new Set(WORDS);

/** Solvable start→target pairs (verified by the test suite). */
export const PAIRS: [string, string][] = [
  ['cold', 'warm'],
  ['mine', 'rose'],
  ['cast', 'fish'],
  ['dock', 'desk'],
  ['cake', 'mind'],
  ['fort', 'sire'],
  ['ball', 'best'],
  ['rope', 'cave'],
  ['hard', 'core'],
  ['time', 'gale']
];

const A = 'a'.charCodeAt(0);

/** Words in `set` that differ from `word` by exactly one letter. */
export function neighbors(word: string, set: Set<string> = WORD_SET): string[] {
  const out: string[] = [];
  for (let i = 0; i < word.length; i++) {
    for (let c = 0; c < 26; c++) {
      const ch = String.fromCharCode(A + c);
      if (ch === word[i]) continue;
      const cand = word.slice(0, i) + ch + word.slice(i + 1);
      if (set.has(cand)) out.push(cand);
    }
  }
  return out;
}

/** Shortest ladder (inclusive of both ends) or null if unreachable. BFS. */
export function bfsPath(start: string, target: string, set: Set<string> = WORD_SET): string[] | null {
  if (start === target) return [start];
  const prev = new Map<string, string>();
  const seen = new Set<string>([start]);
  let frontier = [start];
  while (frontier.length) {
    const next: string[] = [];
    for (const w of frontier) {
      for (const nb of neighbors(w, set)) {
        if (seen.has(nb)) continue;
        seen.add(nb);
        prev.set(nb, w);
        if (nb === target) {
          const path = [target];
          let cur = target;
          while (cur !== start) {
            cur = prev.get(cur)!;
            path.unshift(cur);
          }
          return path;
        }
        next.push(nb);
      }
    }
    frontier = next;
  }
  return null;
}

/** Number of steps from start to target (Infinity if unreachable). */
export function bfsDist(start: string, target: string, set: Set<string> = WORD_SET): number {
  const path = bfsPath(start, target, set);
  return path ? path.length - 1 : Infinity;
}

export function isStep(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff++;
  return diff === 1 && WORD_SET.has(b);
}

/** The seeded start/target pair for a match. */
export function pickPair(seed: number): [string, string] {
  return PAIRS[Math.abs(seed) % PAIRS.length];
}
