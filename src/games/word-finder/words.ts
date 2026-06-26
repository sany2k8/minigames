/**
 * Compact offline dictionary. Each base word is paired with curated sub-words so
 * every puzzle has a rich, fully-offline answer set (no network needed).
 */
export const BASE_WORDS = ['master', 'planet', 'garden', 'silent', 'friend', 'orange', 'animal', 'rescue'];

const WORDS = [
  // master
  'master', 'stream', 'tamers', 'mast', 'mats', 'rats', 'arts', 'star', 'tars', 'ears', 'eats', 'seat', 'seam', 'team',
  'meat', 'mate', 'mates', 'rate', 'rates', 'tear', 'tears', 'stare', 'tame', 'tames', 'same', 'mare', 'rams', 'mars',
  'art', 'rat', 'ear', 'eat', 'sea', 'tea', 'ate', 'are', 'tar', 'ram', 'mar', 'mat', 'sat', 'term', 'terms', 'steam',
  // planet
  'planet', 'plane', 'plant', 'plate', 'plan', 'plea', 'pleat', 'petal', 'pant', 'pane', 'pale', 'neat', 'lane', 'late',
  'lean', 'tale', 'teal', 'peal', 'nape', 'pal', 'pan', 'pat', 'pet', 'ten', 'tan', 'tap', 'nap', 'net', 'ant', 'ape',
  'apt', 'lap', 'let', 'lent', 'leap',
  // garden
  'garden', 'danger', 'gander', 'range', 'anger', 'grade', 'grand', 'drag', 'rang', 'dear', 'dare', 'read', 'dean',
  'near', 'earn', 'rage', 'gear', 'nag', 'gad', 'den', 'end', 'red', 'era', 'ran', 'and', 'age', 'ade',
  // silent
  'silent', 'listen', 'tinsel', 'enlist', 'inlets', 'tins', 'lint', 'lent', 'line', 'lines', 'lies', 'lite', 'list',
  'slit', 'nest', 'nets', 'sent', 'tens', 'ties', 'site', 'nile', 'lens', 'nil', 'tin', 'sin', 'sit', 'set', 'lie',
  'tie', 'its', 'lit', 'tile', 'tiles', 'isle',
  // friend
  'friend', 'finer', 'fried', 'fired', 'diner', 'fine', 'find', 'fire', 'rind', 'ride', 'rein', 'dire', 'dine', 'fin',
  'fir', 'fed', 'fen', 'rid', 'ire', 'ref', 'din', 'rife', 'nerd',
  // orange
  'orange', 'anger', 'range', 'groan', 'organ', 'argon', 'gore', 'gone', 'rage', 'gear', 'near', 'earn', 'nag', 'age',
  'ago', 'ore', 'oar', 'ear', 'era', 'ran', 'ego', 'nor', 'rag', 'eon', 'ogre', 'roan',
  // animal
  'animal', 'mania', 'mail', 'main', 'mina', 'lama', 'lain', 'nail', 'anal', 'alai', 'aim', 'man', 'lam', 'nil', 'ail',
  'ami', 'lima', 'mil',
  // rescue
  'rescue', 'cure', 'cues', 'cure', 'curse', 'crus', 'reuse', 'ruse', 'sure', 'user', 'rues', 'cue', 'sec', 'use',
  'rue', 'sue', 'ecru', 'cees', 'recs'
];

export const DICT = new Set(WORDS);

const letterCount = (s: string) => {
  const m: Record<string, number> = {};
  for (const ch of s) m[ch] = (m[ch] ?? 0) + 1;
  return m;
};

/** Can `word` be built from the multiset of `letters`? */
export function canForm(word: string, letters: string): boolean {
  const have = letterCount(letters);
  for (const ch of word) {
    if (!have[ch]) return false;
    have[ch]--;
  }
  return true;
}

/** All dictionary words (len >= 3) formable from the given letters. */
export function solutionsFor(letters: string): string[] {
  const out: string[] = [];
  for (const w of DICT) if (w.length >= 3 && canForm(w, letters)) out.push(w);
  return out.sort((a, b) => b.length - a.length || a.localeCompare(b));
}

export const wordScore = (w: string) => w.length * 10 + Math.max(0, w.length - 3) * 5;
