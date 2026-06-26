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

interface AppState {
  favorites: string[];
  highScores: Record<string, number>;
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
