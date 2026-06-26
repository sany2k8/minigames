export const N = 5;

// 5x5 pixel-art designs ('#' filled, '.' empty).
export const DESIGNS = [
  ['.#.#.', '.#.#.', '.....', '#...#', '.###.'], // smiley
  ['.#.#.', '#####', '#####', '.###.', '..#..'], // heart
  ['..#..', '.###.', '#####', '..#..', '..#..'], // arrow up
  ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'], // cross/x
  ['.###.', '#...#', '#...#', '#...#', '.###.'], // O ring
  ['#####', '#....', '###..', '#....', '#####'], // E
  ['..#..', '.###.', '#####', '.###.', '..#..'], // diamond
  ['#.#.#', '.#.#.', '#.#.#', '.#.#.', '#.#.#'], // checker
  ['.....', '.###.', '.#.#.', '.###.', '.....'], // box
  ['#...#', '##.##', '#.#.#', '#...#', '#...#'], // M
  ['..#..', '..#..', '#####', '..#..', '..#..'], // plus
  ['.#.#.', '.....', '..#..', '#...#', '.###.'] // face 2
];

export type Sol = boolean[]; // length 25

export function solutionFor(seed: number): Sol {
  const design = DESIGNS[seed % DESIGNS.length];
  const sol: Sol = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) sol.push(design[r][c] === '#');
  return sol;
}

const runs = (line: boolean[]): number[] => {
  const out: number[] = [];
  let cur = 0;
  for (const v of line) {
    if (v) cur++;
    else if (cur) {
      out.push(cur);
      cur = 0;
    }
  }
  if (cur) out.push(cur);
  return out.length ? out : [0];
};

export function rowClue(sol: Sol, r: number): number[] {
  return runs(Array.from({ length: N }, (_, c) => sol[r * N + c]));
}
export function colClue(sol: Sol, c: number): number[] {
  return runs(Array.from({ length: N }, (_, r) => sol[r * N + c]));
}

/** state: 0 empty, 1 filled, 2 marked-X. Solved when filled === solution. */
export function isSolved(state: number[], sol: Sol): boolean {
  return state.every((v, i) => (v === 1) === sol[i]);
}

export function progress(state: number[], sol: Sol): number {
  const totalFill = sol.filter(Boolean).length;
  let correct = 0;
  for (let i = 0; i < sol.length; i++) if (sol[i] && state[i] === 1) correct++;
  return totalFill ? Math.round((correct / totalFill) * 100) : 100;
}
