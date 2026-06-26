import type { Rng } from '../../engine/rng';
import type { Difficulty } from '../../engine/types';

/**
 * Perfect Slice — a convex shape must be cut into N equal-area pieces using
 * straight cuts. Each cut is an infinite line that splits every piece it passes
 * through into two convex halves. The closer the final pieces are to N equal
 * shares, the higher the score. All geometry is pure so the bot and tests can
 * use it directly. The viewBox is 100 x 100.
 */

export interface Pt {
  x: number;
  y: number;
}

export interface Config {
  /** Target number of equal pieces. */
  pieces: number;
  /** Cuts available (pieces - 1). */
  cuts: number;
}

export function config(difficulty: Difficulty): Config {
  switch (difficulty) {
    case 'easy':
      return { pieces: 2, cuts: 1 };
    case 'hard':
      return { pieces: 4, cuts: 3 };
    default:
      return { pieces: 3, cuts: 2 };
  }
}

const EPS = 0.05;

/** Signed-doubled area via the shoelace formula; returns absolute area. */
export function polygonArea(poly: Pt[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) / 2;
}

/** Which side of the directed line a→b a point lies on (>0 left, <0 right). */
function side(a: Pt, b: Pt, p: Pt): number {
  return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
}

/**
 * Split a convex polygon by the infinite line through a,b. Returns the two
 * halves (each may have <3 points / ~0 area if the line misses the polygon).
 */
export function splitConvex(poly: Pt[], a: Pt, b: Pt): { left: Pt[]; right: Pt[] } {
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const sp = side(a, b, p);
    const sq = side(a, b, q);
    if (sp >= 0) left.push(p);
    if (sp <= 0) right.push(p);
    if ((sp > 0 && sq < 0) || (sp < 0 && sq > 0)) {
      const t = sp / (sp - sq);
      const inter = { x: p.x + t * (q.x - p.x), y: p.y + t * (q.y - p.y) };
      left.push(inter);
      right.push(inter);
    }
  }
  return { left, right };
}

/** Apply a cut line to every piece, splitting any it genuinely divides. */
export function applyCut(pieces: Pt[][], a: Pt, b: Pt): Pt[][] {
  const out: Pt[][] = [];
  for (const piece of pieces) {
    const { left, right } = splitConvex(piece, a, b);
    const la = left.length >= 3 ? polygonArea(left) : 0;
    const ra = right.length >= 3 ? polygonArea(right) : 0;
    if (la > EPS && ra > EPS) {
      out.push(left, right);
    } else {
      out.push(piece);
    }
  }
  return out;
}

/**
 * Score 0..100 for how close the pieces are to N equal shares. Penalises both
 * unequal areas AND the wrong number of pieces (since each piece is compared to
 * total/N). 100 = perfect.
 */
export function sliceScore(pieces: Pt[][], n: number): number {
  const areas = pieces.map(polygonArea);
  const total = areas.reduce((s, a) => s + a, 0);
  if (total <= 0) return 0;
  const ideal = total / n;
  const err = areas.reduce((s, a) => s + Math.abs(a - ideal), 0) / total;
  return Math.max(0, Math.round(100 * (1 - err)));
}

/** A convex shape centred in the viewBox: regular polygon, rotated + stretched. */
export function generate(rng: Rng, _cfg: Config): Pt[] {
  const sides = rng.pick([3, 4, 5, 6]);
  const rot = rng.float() * Math.PI;
  const sx = 0.82 + rng.float() * 0.36;
  const sy = 0.82 + rng.float() * 0.36;
  const cx = 50;
  const cy = 50;
  const r = 34;
  const poly: Pt[] = [];
  for (let i = 0; i < sides; i++) {
    const ang = rot + (i * 2 * Math.PI) / sides;
    poly.push({ x: cx + Math.cos(ang) * r * sx, y: cy + Math.sin(ang) * r * sy });
  }
  return poly;
}

/** Total area of the polygon parts lying left of the vertical line x. */
function areaLeftOf(pieces: Pt[][], x: number): number {
  let a = 0;
  for (const piece of pieces) {
    const { left } = splitConvex(piece, { x, y: 0 }, { x, y: 100 });
    if (left.length >= 3) a += polygonArea(left);
  }
  return a;
}

/**
 * The x-positions of N-1 vertical cuts that divide the shape into N equal-area
 * vertical strips. Drives the bot — applying these as cuts yields ~equal pieces.
 */
export function equalVerticalCuts(poly: Pt[], n: number): number[] {
  const xs = poly.map((p) => p.x);
  const lo0 = Math.min(...xs);
  const hi0 = Math.max(...xs);
  const total = polygonArea(poly);
  const cuts: number[] = [];
  for (let i = 1; i < n; i++) {
    const target = (i / n) * total;
    let lo = lo0;
    let hi = hi0;
    for (let it = 0; it < 48; it++) {
      const mid = (lo + hi) / 2;
      if (areaLeftOf([poly], mid) < target) lo = mid;
      else hi = mid;
    }
    cuts.push((lo + hi) / 2);
  }
  return cuts;
}
