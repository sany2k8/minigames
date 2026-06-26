import type { Rng } from '../../engine/rng';

export interface MineConfig {
  w: number;
  h: number;
  mines: number;
}

export function mineConfig(d: 'easy' | 'medium' | 'hard'): MineConfig {
  if (d === 'easy') return { w: 8, h: 8, mines: 10 };
  if (d === 'hard') return { w: 12, h: 12, mines: 32 };
  return { w: 10, h: 10, mines: 18 };
}

export interface MineBoard {
  w: number;
  h: number;
  mine: boolean[];
  count: number[]; // adjacent mine count
}

export function neighbors(w: number, h: number, i: number): number[] {
  const r = Math.floor(i / w);
  const c = i % w;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const rr = r + dr;
      const cc = c + dc;
      if (rr >= 0 && rr < h && cc >= 0 && cc < w) out.push(rr * w + cc);
    }
  return out;
}

export function generate(rng: Rng, cfg: MineConfig): MineBoard {
  const total = cfg.w * cfg.h;
  const mine = new Array(total).fill(false);
  const cells = rng.shuffle(Array.from({ length: total }, (_, i) => i));
  for (let i = 0; i < cfg.mines; i++) mine[cells[i]] = true;
  const count = new Array(total).fill(0);
  for (let i = 0; i < total; i++) {
    if (mine[i]) continue;
    count[i] = neighbors(cfg.w, cfg.h, i).filter((n) => mine[n]).length;
  }
  return { w: cfg.w, h: cfg.h, mine, count };
}

/** Reveal a cell, flooding through zero-count regions. Returns new revealed set. */
export function reveal(board: MineBoard, revealed: Set<number>, cell: number): Set<number> {
  const next = new Set(revealed);
  const stack = [cell];
  while (stack.length) {
    const cur = stack.pop()!;
    if (next.has(cur)) continue;
    next.add(cur);
    if (board.count[cur] === 0 && !board.mine[cur]) {
      for (const n of neighbors(board.w, board.h, cur)) if (!next.has(n) && !board.mine[n]) stack.push(n);
    }
  }
  return next;
}

export const safeCells = (board: MineBoard) => board.mine.length - board.mine.filter(Boolean).length;
export const isWon = (board: MineBoard, revealed: Set<number>) => revealed.size === safeCells(board);
