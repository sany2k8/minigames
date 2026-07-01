/**
 * Weekly quests. Three rotating missions per week, picked deterministically
 * from a pool by week key so everyone gets the same set, with progress tracked
 * by lightweight weekly counters in the store and a points bonus on claim.
 */
export type QuestKind = 'wins' | 'plays' | 'distinct' | 'daily' | 'score';

export interface Quest {
  id: string;
  title: string;
  desc: string;
  icon: string;
  kind: QuestKind;
  goal: number;
  reward: number;
}

/** Monday-aligned week index, e.g. `W2891`. Stable across reloads. */
export function weekKey(d: Date = new Date()): string {
  const ms = d.getTime() - d.getTimezoneOffset() * 60000;
  const day = Math.floor(ms / 86400000);
  const week = Math.floor((day + 3) / 7); // +3 → weeks break on Monday
  return `W${week}`;
}

const POOL: Quest[] = [
  { id: 'win3', title: 'Triple Threat', desc: 'Win 3 games', icon: '🏆', kind: 'wins', goal: 3, reward: 150 },
  { id: 'win6', title: 'Winning Week', desc: 'Win 6 games', icon: '🔥', kind: 'wins', goal: 6, reward: 300 },
  { id: 'win10', title: 'Dominator', desc: 'Win 10 games', icon: '👑', kind: 'wins', goal: 10, reward: 500 },
  { id: 'play5', title: 'Warm Up', desc: 'Play 5 games', icon: '🎮', kind: 'plays', goal: 5, reward: 120 },
  { id: 'play12', title: 'Marathon', desc: 'Play 12 games', icon: '🏃', kind: 'plays', goal: 12, reward: 280 },
  { id: 'distinct3', title: 'Sampler', desc: 'Play 3 different games', icon: '🍱', kind: 'distinct', goal: 3, reward: 150 },
  { id: 'distinct6', title: 'Adventurer', desc: 'Play 6 different games', icon: '🧭', kind: 'distinct', goal: 6, reward: 320 },
  { id: 'daily2', title: 'Daily Double', desc: 'Finish 2 Daily Challenges', icon: '🗓️', kind: 'daily', goal: 2, reward: 200 },
  { id: 'daily4', title: 'Daily Devotee', desc: 'Finish 4 Daily Challenges', icon: '📅', kind: 'daily', goal: 4, reward: 420 },
  { id: 'score1500', title: 'Big Score', desc: 'Score 1,500+ in any game', icon: '⭐', kind: 'score', goal: 1500, reward: 200 },
  { id: 'score4000', title: 'Score Hunter', desc: 'Score 4,000+ in any game', icon: '🌟', kind: 'score', goal: 4000, reward: 400 }
];

function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** The three quests for a given week (deterministic, distinct). */
export function weeklyQuests(wk: string = weekKey()): Quest[] {
  const order = POOL.map((q, i) => ({ q, r: hash(`${wk}:${q.id}:${i}`) }))
    .sort((a, b) => a.r - b.r)
    .map((x) => x.q);
  // Avoid two quests of the same kind for variety.
  const picked: Quest[] = [];
  for (const q of order) {
    if (picked.length === 3) break;
    if (!picked.some((p) => p.kind === q.kind)) picked.push(q);
  }
  return picked;
}

export interface QuestCounters {
  wins: number;
  plays: number;
  distinct: number;
  daily: number;
  bestScore: number;
}

/** Current progress toward a quest given the week's counters. */
export function questProgress(q: Quest, c: QuestCounters): number {
  switch (q.kind) {
    case 'wins':
      return c.wins;
    case 'plays':
      return c.plays;
    case 'distinct':
      return c.distinct;
    case 'daily':
      return c.daily;
    case 'score':
      return c.bestScore;
  }
}
