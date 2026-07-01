import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Difficulty } from '../engine/types';
import { evaluate } from '../lib/achievements';
import { weekKey } from '../lib/quests';
import { DEFAULT_OWNED } from '../lib/cosmetics';
import { nextRating, START_RATING } from '../lib/adaptive';
import { dayKey } from '../lib/daily';

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
  music: boolean;
  haptics: boolean;
  dailyReminder: boolean;
  adaptive: boolean; // auto-tune bot difficulty per game
  botRating: Record<string, number>; // fairness rating per game [0,2]
  p1Name: string;
  p2Name: string;

  // reward system
  points: number;
  gamesWon: number;
  gamesPlayed: number;

  // daily challenge
  dailyStreak: number;
  dailyBest: number;
  lastDailyKey: string; // last day the challenge was completed
  dailyWins: number; // total daily challenges won
  dailyHistory: Record<string, { gameId: string; outcome: Outcome; score?: number }>;

  // achievements
  unlocked: string[]; // achievement ids earned
  recentUnlocks: string[]; // freshly earned, drained by the toast UI

  // weekly quests (counters reset each week)
  questWeek: string;
  qWins: number;
  qPlays: number;
  qDistinct: string[];
  qDaily: number;
  qBestScore: number;
  questClaimed: string[];

  // cosmetics
  coins: number;
  ownedCosmetics: string[];
  theme: string; // equipped theme id
  avatar: string; // equipped avatar id

  // ghost replays: best solo-race run as a progress-over-time path per game
  ghosts: Record<string, { time: number; path: { t: number; p: number }[] }>;

  // activity heatmap: plays per calendar day (YYYY-MM-DD)
  activity: Record<string, number>;

  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  recordScore: (id: string, score: number) => void;
  recordResult: (id: string, outcome: Outcome) => void;
  markPlayed: (id: string) => void;
  setDifficulty: (d: Difficulty) => void;
  setSound: (on: boolean) => void;
  setMusic: (on: boolean) => void;
  setHaptics: (on: boolean) => void;
  setDailyReminder: (on: boolean) => void;
  setAdaptive: (on: boolean) => void;
  adjustBotRating: (gameId: string, humanWon: boolean, draw: boolean) => void;
  setNames: (p1: string, p2: string) => void;
  awardWin: (amount: number) => void;
  completeDaily: (key: string, gameId: string, outcome: Outcome, score?: number) => void;
  syncAchievements: () => void;
  seedAchievements: () => void;
  clearRecentUnlocks: () => void;
  claimQuest: (id: string, reward: number) => void;
  buyCosmetic: (id: string, cost: number) => boolean;
  equip: (kind: 'theme' | 'avatar', id: string) => void;
  saveGhost: (gameId: string, time: number, path: { t: number; p: number }[]) => void;
  resetProgress: () => void;
}

/** Reset patch when the persisted quest week is stale; null when still current. */
function questRoll(s: AppState): Partial<AppState> | null {
  const wk = weekKey();
  if (s.questWeek === wk) return null;
  return { questWeek: wk, qWins: 0, qPlays: 0, qDistinct: [], qDaily: 0, qBestScore: 0, questClaimed: [] };
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
      music: false,
      haptics: true,
      dailyReminder: false,
      adaptive: true,
      botRating: {},
      p1Name: 'Player 1',
      p2Name: 'Player 2',
      points: 0,
      gamesWon: 0,
      gamesPlayed: 0,
      dailyStreak: 0,
      dailyBest: 0,
      lastDailyKey: '',
      dailyWins: 0,
      dailyHistory: {},
      unlocked: [],
      recentUnlocks: [],
      questWeek: '',
      qWins: 0,
      qPlays: 0,
      qDistinct: [],
      qDaily: 0,
      qBestScore: 0,
      questClaimed: [],
      coins: 0,
      ownedCosmetics: DEFAULT_OWNED,
      theme: 'theme-coral',
      avatar: 'avatar-initials',
      ghosts: {},
      activity: {},

      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((f) => f !== id)
            : [...s.favorites, id]
        })),
      isFavorite: (id) => get().favorites.includes(id),
      recordScore: (id, score) =>
        set((s) => {
          const roll = questRoll(s) ?? {};
          const base = { ...s, ...roll };
          return {
            ...roll,
            highScores: { ...s.highScores, [id]: Math.max(score, s.highScores[id] ?? 0) },
            qBestScore: Math.max(base.qBestScore, score)
          };
        }),
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
          const roll = questRoll(s) ?? {};
          const base = { ...s, ...roll };
          return {
            ...roll,
            stats: { ...s.stats, [id]: next },
            qWins: base.qWins + (outcome === 'win' ? 1 : 0)
          };
        }),
      markPlayed: (id) =>
        set((s) => {
          const roll = questRoll(s) ?? {};
          const base = { ...s, ...roll };
          const today = dayKey();
          return {
            ...roll,
            recent: [id, ...s.recent.filter((r) => r !== id)].slice(0, 12),
            gamesPlayed: s.gamesPlayed + 1,
            qPlays: base.qPlays + 1,
            qDistinct: base.qDistinct.includes(id) ? base.qDistinct : [...base.qDistinct, id],
            activity: { ...s.activity, [today]: (s.activity[today] ?? 0) + 1 }
          };
        }),
      setDifficulty: (difficulty) => set({ difficulty }),
      setSound: (sound) => set({ sound }),
      setMusic: (music) => set({ music }),
      setHaptics: (haptics) => set({ haptics }),
      setDailyReminder: (dailyReminder) => set({ dailyReminder }),
      setAdaptive: (adaptive) => set({ adaptive }),
      adjustBotRating: (gameId, humanWon, draw) =>
        set((s) => ({
          botRating: { ...s.botRating, [gameId]: nextRating(s.botRating[gameId] ?? START_RATING, humanWon, draw) }
        })),
      setNames: (p1Name, p2Name) => set({ p1Name, p2Name }),
      // Lifetime points drive the level; coins (a fifth of the points) are the
      // spendable wallet for cosmetics.
      awardWin: (amount) =>
        set((s) => ({ points: s.points + amount, gamesWon: s.gamesWon + 1, coins: s.coins + Math.round(amount / 5) })),
      completeDaily: (key, gameId, outcome, score) =>
        set((s) => {
          const already = s.lastDailyKey === key;
          // Streak: +1 if yesterday was the last completed day, otherwise reset
          // to 1. Replaying the same day doesn't change the streak.
          let streak = s.dailyStreak;
          if (!already) {
            const yesterday = (() => {
              const d = new Date(`${key}T00:00:00`);
              d.setDate(d.getDate() - 1);
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            })();
            streak = s.lastDailyKey === yesterday ? s.dailyStreak + 1 : 1;
          }
          const prev = s.dailyHistory[key];
          const wonNow = outcome === 'win' && (!prev || prev.outcome !== 'win');
          const roll = questRoll(s) ?? {};
          const base = { ...s, ...roll };
          return {
            ...roll,
            dailyStreak: streak,
            dailyBest: Math.max(s.dailyBest, streak),
            lastDailyKey: key,
            dailyWins: s.dailyWins + (wonNow ? 1 : 0),
            dailyHistory: { ...s.dailyHistory, [key]: { gameId, outcome, score } },
            // Count each distinct day finished toward the weekly quest.
            qDaily: already ? base.qDaily : base.qDaily + 1
          };
        }),
      // Add any newly-satisfied achievements, queuing them for the toast.
      syncAchievements: () =>
        set((s) => {
          const passing = evaluate(s);
          const newly = passing.filter((id) => !s.unlocked.includes(id));
          if (newly.length === 0) return {};
          return { unlocked: [...s.unlocked, ...newly], recentUnlocks: [...s.recentUnlocks, ...newly] };
        }),
      // One-time silent backfill so returning players don't get a flood of toasts.
      seedAchievements: () =>
        set((s) => (s.unlocked.length === 0 ? { unlocked: evaluate(s) } : {})),
      clearRecentUnlocks: () => set({ recentUnlocks: [] }),
      claimQuest: (id, reward) =>
        set((s) => {
          const roll = questRoll(s) ?? {};
          const base = { ...s, ...roll };
          if (base.questClaimed.includes(id)) return roll;
          return {
            ...roll,
            points: base.points + reward,
            coins: base.coins + Math.round(reward / 5),
            questClaimed: [...base.questClaimed, id]
          };
        }),
      buyCosmetic: (id, cost) => {
        const s = get();
        if (s.ownedCosmetics.includes(id) || s.coins < cost) return false;
        set({ coins: s.coins - cost, ownedCosmetics: [...s.ownedCosmetics, id] });
        return true;
      },
      equip: (kind, id) => set(kind === 'theme' ? { theme: id } : { avatar: id }),
      // Keep only the fastest run's path for the ghost to race against.
      saveGhost: (gameId, time, path) =>
        set((s) => {
          const cur = s.ghosts[gameId];
          if (cur && cur.time <= time) return {};
          return { ghosts: { ...s.ghosts, [gameId]: { time, path } } };
        }),
      resetProgress: () => set({
        highScores: {},
        stats: {},
        points: 0,
        gamesWon: 0,
        gamesPlayed: 0,
        recent: [],
        favorites: [],
        dailyStreak: 0,
        dailyBest: 0,
        lastDailyKey: '',
        dailyWins: 0,
        dailyHistory: {},
        unlocked: [],
        recentUnlocks: [],
        qWins: 0,
        qPlays: 0,
        qDistinct: [],
        qDaily: 0,
        qBestScore: 0,
        questClaimed: [],
        coins: 0,
        ownedCosmetics: DEFAULT_OWNED,
        theme: 'theme-coral',
        avatar: 'avatar-initials',
        ghosts: {},
        botRating: {},
        activity: {}
      })
    }),
    { name: 'no-wifi-games' }
  )
);
