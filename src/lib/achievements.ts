/**
 * Achievements / badges. Pure, declarative milestones evaluated against the
 * persisted store snapshot — unlocking is just "does this test pass now?". The
 * store calls `evaluate` after progress changes and shows a toast for new ones.
 */
import type { GameStats } from '../store/store';

/** The slice of store state achievements read. AppState is a superset. */
export interface AchState {
  points: number;
  gamesWon: number;
  gamesPlayed: number;
  favorites: string[];
  recent: string[];
  stats: Record<string, GameStats>;
  highScores: Record<string, number>;
  dailyStreak: number;
  dailyBest: number;
  dailyWins: number;
}

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string; // emoji
  grad: string;
  test: (s: AchState) => boolean;
}

const distinctPlayed = (s: AchState) =>
  new Set([...Object.keys(s.stats), ...Object.keys(s.highScores), ...s.recent]).size;
const maxBestStreak = (s: AchState) =>
  Object.values(s.stats).reduce((m, st) => Math.max(m, st.best), 0);
const gamesMastered = (s: AchState) =>
  Object.values(s.stats).filter((st) => st.wins > 0).length;

const G = {
  gold: 'linear-gradient(135deg,#F59E0B,#FB923C)',
  rose: 'linear-gradient(135deg,#FB7185,#F43F5E)',
  violet: 'linear-gradient(135deg,#8B5CF6,#A855F7)',
  blue: 'linear-gradient(135deg,#3B82F6,#06B6D4)',
  green: 'linear-gradient(135deg,#22C55E,#84CC16)',
  orange: 'linear-gradient(135deg,#F97316,#EF4444)'
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_win', title: 'First Win', desc: 'Win your first game', icon: '🎉', grad: G.gold, test: (s) => s.gamesWon >= 1 },
  { id: 'win_10', title: 'On a Roll', desc: 'Win 10 games', icon: '🔥', grad: G.rose, test: (s) => s.gamesWon >= 10 },
  { id: 'win_50', title: 'Champion', desc: 'Win 50 games', icon: '🏆', grad: G.gold, test: (s) => s.gamesWon >= 50 },
  { id: 'win_100', title: 'Legend', desc: 'Win 100 games', icon: '👑', grad: G.orange, test: (s) => s.gamesWon >= 100 },
  { id: 'streak_3', title: 'Hot Streak', desc: 'Win 3 in a row in one game', icon: '⚡', grad: G.orange, test: (s) => maxBestStreak(s) >= 3 },
  { id: 'streak_10', title: 'Unstoppable', desc: 'Win 10 in a row in one game', icon: '💥', grad: G.rose, test: (s) => maxBestStreak(s) >= 10 },
  { id: 'explorer_10', title: 'Explorer', desc: 'Play 10 different games', icon: '🧭', grad: G.blue, test: (s) => distinctPlayed(s) >= 10 },
  { id: 'explorer_25', title: 'Globetrotter', desc: 'Play 25 different games', icon: '🗺️', grad: G.blue, test: (s) => distinctPlayed(s) >= 25 },
  { id: 'master_10', title: 'Jack of All Games', desc: 'Win at 10 different games', icon: '🎯', grad: G.green, test: (s) => gamesMastered(s) >= 10 },
  { id: 'collector_5', title: 'Collector', desc: 'Favorite 5 games', icon: '❤️', grad: G.violet, test: (s) => s.favorites.length >= 5 },
  { id: 'points_1k', title: 'Getting Started', desc: 'Earn 1,000 points', icon: '⭐', grad: G.gold, test: (s) => s.points >= 1000 },
  { id: 'points_5k', title: 'Devotee', desc: 'Earn 5,000 points', icon: '🌟', grad: G.orange, test: (s) => s.points >= 5000 },
  { id: 'points_10k', title: 'High Roller', desc: 'Earn 10,000 points', icon: '💎', grad: G.violet, test: (s) => s.points >= 10000 },
  { id: 'daily_first', title: 'Daily Habit', desc: 'Win a Daily Challenge', icon: '🗓️', grad: G.green, test: (s) => s.dailyWins >= 1 },
  { id: 'daily_7', title: 'Week Warrior', desc: 'Reach a 7-day daily streak', icon: '📅', grad: G.blue, test: (s) => s.dailyBest >= 7 },
  { id: 'daily_30', title: 'Month of Play', desc: 'Reach a 30-day daily streak', icon: '🎖️', grad: G.gold, test: (s) => s.dailyBest >= 30 },
  { id: 'played_100', title: 'Dedicated', desc: 'Play 100 games total', icon: '🕹️', grad: G.rose, test: (s) => s.gamesPlayed >= 100 }
];

/** Ids of every achievement currently satisfied by the snapshot. */
export function evaluate(s: AchState): string[] {
  return ACHIEVEMENTS.filter((a) => a.test(s)).map((a) => a.id);
}

export const achievementById = (id: string) => ACHIEVEMENTS.find((a) => a.id === id);
