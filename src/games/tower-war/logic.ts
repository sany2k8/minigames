import type { Rng } from '../../engine/rng';

export interface Node {
  id: number;
  x: number; // normalized 0..1
  y: number;
  owner: number; // seat index, or -1 neutral
  troops: number;
  cap: number;
}

export interface Movement {
  id: number;
  from: number;
  to: number;
  owner: number;
  troops: number;
  t: number; // 0..1 progress
}

const POSITIONS = [
  [0.5, 0.12],
  [0.2, 0.32],
  [0.8, 0.32],
  [0.5, 0.5],
  [0.2, 0.68],
  [0.8, 0.68],
  [0.5, 0.88]
];

/** Lays out nodes; first seat bottom, second seat top, rest neutral. */
export function layout(rng: Rng, seatCount: number): Node[] {
  const nodes: Node[] = POSITIONS.map((p, i) => ({
    id: i,
    x: p[0],
    y: p[1],
    owner: -1,
    troops: rng.range(4, 8),
    cap: 40
  }));
  nodes[6].owner = 0;
  nodes[6].troops = 12;
  nodes[0].owner = seatCount > 1 ? 1 : 1;
  nodes[0].troops = 12;
  return nodes;
}

export const dist = (a: Node, b: Node) => Math.hypot(a.x - b.x, a.y - b.y);

/** Returns the winning seat if the battle is decided, else null. */
export function winner(nodes: Node[]): number | null {
  const owners = new Set(nodes.map((n) => n.owner));
  if (owners.has(-1)) return null;
  return owners.size === 1 ? [...owners][0] : null;
}

/** Bot picks a move: strongest own node → weakest reachable non-own node. */
export function botPlan(nodes: Node[], seat: number): { from: number; to: number } | null {
  const mine = nodes.filter((n) => n.owner === seat && n.troops > 8).sort((a, b) => b.troops - a.troops);
  if (!mine.length) return null;
  const from = mine[0];
  const targets = nodes
    .filter((n) => n.owner !== seat)
    .sort((a, b) => a.troops - b.troops || dist(from, a) - dist(from, b));
  if (!targets.length) return null;
  return { from: from.id, to: targets[0].id };
}
