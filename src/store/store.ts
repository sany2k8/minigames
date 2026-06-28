import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Difficulty } from '../engine/types';

/** Milestone tiers shown on the level badge. */
const LEVEL_TITLES = ['Bronze', 'Bronze', 'Silver', 'Silver', 'Gold', 'Gold', 'Platinum', 'Diamond'];

export interface LevelInfo {
  level: number;
  title: string;
  into: number; // points earned into the current level
  span: number; // points needed to clear the current level
  pct: number; // 0..100 progress to next level
}

export function levelInfo(points: number): LevelInfo {
  let level = 1;
  let need = 200; // points to clear level 1
  let acc = 0;
  while (points >= acc + need) {
    acc += need;
    level++;
    need = Math.round(need * 1.35);
  }
  const into = points - acc;
  return {
    level,
    title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)],
    into,
    span: need,
    pct: Math.round((into / need) * 100)
  };
}

/** Points awarded for a human win, scaled by difficulty. */
export function winPoints(difficulty: Difficulty): number {
  return difficulty === 'hard' ? 120 : difficulty === 'medium' ? 80 : 50;
}

export type Outcome = 'win' | 'loss' | 'draw';
export interface GameStats {
  wins: number;
  draws: number;
  losses: number;
  streak: number; // current win streak
  best: number; // best win streak
}
export const emptyStats = (): GameStats => ({ wins: 0, draws: 0, losses: 0, streak: 0, best: 0 });
export const statsFor = (s: AppState, id: string): GameStats => s.stats[id] ?? emptyStats();
export const winPct = (st: GameStats): number => {
  const total = st.wins + st.draws + st.losses;
  return total === 0 ? 0 : Math.round((st.wins / total) * 100);
};

interface AppState {
  favorites: string[];
  highScores: Record<string, number>;
  stats: Record<string, GameStats>;
  recent: string[];
  difficulty: Difficulty;
  sound: boolean;
  haptics: boolean;
  p1Name: string;
  p2Name: string;

  // reward system
  points: number;
  gamesWon: number;
  gamesPlayed: number;

  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  recordScore: (id: string, score: number) => void;
  recordResult: (id: string, outcome: Outcome) => void;
  markPlayed: (id: string) => void;
  setDifficulty: (d: Difficulty) => void;
  setSound: (on: boolean) => void;
  setHaptics: (on: boolean) => void;
  setNames: (p1: string, p2: string) => void;
  awardWin: (amount: number) => void;
  resetProgress: () => void;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      favorites: [],
      highScores: {},
      stats: {},
      recent: [],
      difficulty: 'medium',
      sound: true,
      haptics: true,
      p1Name: 'Player 1',
      p2Name: 'Player 2',
      points: 0,
      gamesWon: 0,
      gamesPlayed: 0,

      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((f) => f !== id)
            : [...s.favorites, id]
        })),
      isFavorite: (id) => get().favorites.includes(id),
      recordScore: (id, score) =>
        set((s) => ({
          highScores: { ...s.highScores, [id]: Math.max(score, s.highScores[id] ?? 0) }
        })),
      recordResult: (id, outcome) =>
        set((s) => {
          const cur = s.stats[id] ?? emptyStats();
          const next: GameStats = {
            wins: cur.wins + (outcome === 'win' ? 1 : 0),
            draws: cur.draws + (outcome === 'draw' ? 1 : 0),
            losses: cur.losses + (outcome === 'loss' ? 1 : 0),
            streak: outcome === 'win' ? cur.streak + 1 : 0,
            best: cur.best
          };
          next.best = Math.max(cur.best, next.streak);
          return { stats: { ...s.stats, [id]: next } };
        }),
      markPlayed: (id) =>
        set((s) => ({
          recent: [id, ...s.recent.filter((r) => r !== id)].slice(0, 12),
          gamesPlayed: s.gamesPlayed + 1
        })),
      setDifficulty: (difficulty) => set({ difficulty }),
      setSound: (sound) => set({ sound }),
      setHaptics: (haptics) => set({ haptics }),
      setNames: (p1Name, p2Name) => set({ p1Name, p2Name }),
      awardWin: (amount) => set((s) => ({ points: s.points + amount, gamesWon: s.gamesWon + 1 })),
      resetProgress: () => set({
        highScores: {},
        stats: {},
        points: 0,
        gamesWon: 0,
        gamesPlayed: 0,
        recent: [],
        favorites: []
      })
    }),
    { name: 'no-wifi-games' }
  )
);
