/**
 * Hand-written types for the Supabase schema in `supabase/migrations/0001_init.sql`.
 * (You can later replace this with `supabase gen types typescript`.)
 */

export interface ProfileRow {
  id: string;
  username: string | null;
  display_name: string;
  avatar: string | null;
  points: number;
  level: number;
  tier: string;
  games_won: number;
  games_played: number;
  created_at: string;
  updated_at: string;
}

export interface GameRow {
  id: string;
  title: string;
  category: string;
  contest: string;
  blurb: string | null;
  featured: boolean;
  created_at: string;
}

export interface FavoriteRow {
  user_id: string;
  game_id: string;
  created_at: string;
}

export interface ScoreRow {
  id: string;
  user_id: string;
  game_id: string;
  best_score: number;
  difficulty: string | null;
  updated_at: string;
}

export interface GameStatsRow {
  id: string;
  user_id: string;
  game_id: string;
  wins: number;
  draws: number;
  losses: number;
  streak: number;
  best_streak: number;
  updated_at: string;
}

export interface MatchResultRow {
  id: string;
  user_id: string;
  game_id: string;
  outcome: 'win' | 'loss' | 'draw';
  score: number | null;
  difficulty: string | null;
  points_awarded: number;
  played_at: string;
}

export interface GlobalLeaderboardRow {
  user_id: string;
  display_name: string;
  points: number;
  level: number;
  tier: string;
  games_won: number;
  games_played: number;
  rank: number;
}

export interface GameLeaderboardRow {
  game_id: string;
  game_title: string;
  user_id: string;
  display_name: string;
  best_score: number;
  difficulty: string | null;
  rank: number;
  updated_at: string;
}
