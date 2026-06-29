/**
 * Cloud sync service — a thin, offline-safe layer over Supabase.
 *
 * Design rules (this app is offline-first):
 *  - Every function is a no-op when the cloud is disabled or the device is
 *    offline. Nothing here ever throws into the UI; failures are swallowed and
 *    logged in dev only. Local state (the zustand store) stays the source of
 *    truth — the cloud is best-effort mirroring on top.
 *  - Identity is the signed-in Supabase user (supabase-js attaches the session
 *    to each request). Writes only run while a user is signed in; `auth.tsx`
 *    flips the authed flag via `setCloudAuthed`.
 */
import { supabase, isCloudEnabled } from './supabase';
import type { Difficulty } from '../engine/types';
import type { Outcome } from '../store/store';
import type { GlobalLeaderboardRow, GameLeaderboardRow } from './database.types';

const online = () => typeof navigator === 'undefined' || navigator.onLine;
const ready = (): boolean => isCloudEnabled && supabase !== null && online();

let authed = false;
/** Called by auth.tsx when the Supabase login state changes. */
export function setCloudAuthed(value: boolean): void {
  authed = value;
}

function warn(scope: string, err: unknown) {
  if (import.meta.env.DEV) console.warn(`[cloud] ${scope} failed:`, err);
}

/** Current user id from the locally cached session (no network round-trip). */
async function uid(): Promise<string | null> {
  const { data } = await supabase!.auth.getSession();
  return data.session?.user?.id ?? null;
}

export interface PlayPayload {
  gameId: string;
  outcome?: Outcome;
  score?: number;
  difficulty?: Difficulty;
  points?: number;
}

/** Mirror one finished game to the cloud (best score + W/L/D history). */
export async function recordPlay(p: PlayPayload): Promise<void> {
  if (!ready() || !authed) return;
  try {
    const tasks: PromiseLike<unknown>[] = [];
    if (typeof p.score === 'number') {
      tasks.push(
        supabase!.rpc('submit_score', {
          p_game_id: p.gameId,
          p_score: Math.round(p.score),
          p_difficulty: p.difficulty ?? null
        })
      );
    }
    if (p.outcome) {
      tasks.push(
        supabase!.rpc('record_match', {
          p_game_id: p.gameId,
          p_outcome: p.outcome,
          p_score: typeof p.score === 'number' ? Math.round(p.score) : null,
          p_difficulty: p.difficulty ?? null,
          p_points: p.points ?? 0
        })
      );
    }
    await Promise.all(tasks);
  } catch (err) {
    warn('recordPlay', err);
  }
}

export interface ProfileSnapshot {
  displayName: string;
  points: number;
  level: number;
  tier: string;
  gamesWon: number;
  gamesPlayed: number;
}

/** Add or remove one favorite for the signed-in user. */
export async function setFavorite(gameId: string, on: boolean): Promise<void> {
  if (!ready() || !authed) return;
  try {
    const id = await uid();
    if (!id) return;
    if (on) {
      await supabase!.from('favorites').upsert({ user_id: id, game_id: gameId });
    } else {
      await supabase!.from('favorites').delete().eq('user_id', id).eq('game_id', gameId);
    }
  } catch (err) {
    warn('setFavorite', err);
  }
}

/** Bulk-push the user's whole favorites set (used on login to back-fill). */
export async function pushFavorites(gameIds: string[]): Promise<void> {
  if (!ready() || !authed || gameIds.length === 0) return;
  try {
    const id = await uid();
    if (!id) return;
    await supabase!.from('favorites').upsert(gameIds.map((game_id) => ({ user_id: id, game_id })));
  } catch (err) {
    warn('pushFavorites', err);
  }
}

/** Bulk-push local high scores (used on login to back-fill the scores table). */
export async function pushHighScores(scores: Record<string, number>): Promise<void> {
  if (!ready() || !authed) return;
  try {
    await Promise.all(
      Object.entries(scores).map(([gameId, score]) =>
        supabase!.rpc('submit_score', { p_game_id: gameId, p_score: Math.round(score), p_difficulty: null })
      )
    );
  } catch (err) {
    warn('pushHighScores', err);
  }
}

/** Push the aggregate profile snapshot (debounced by the caller). */
export async function syncProfile(s: ProfileSnapshot): Promise<void> {
  if (!ready() || !authed) return;
  try {
    await supabase!.rpc('sync_profile', {
      p_display_name: s.displayName,
      p_points: s.points,
      p_level: s.level,
      p_tier: s.tier,
      p_games_won: s.gamesWon,
      p_games_played: s.gamesPlayed
    });
  } catch (err) {
    warn('syncProfile', err);
  }
}

/** Top players by points. Public read — works for guests too. Returns []. */
export async function fetchGlobalLeaderboard(limit = 50): Promise<GlobalLeaderboardRow[]> {
  if (!ready()) return [];
  try {
    const { data, error } = await supabase!
      .from('global_leaderboard')
      .select('*')
      .order('rank', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as GlobalLeaderboardRow[];
  } catch (err) {
    warn('fetchGlobalLeaderboard', err);
    return [];
  }
}

/** Top scores for one game. Public read. Returns []. */
export async function fetchGameLeaderboard(gameId: string, limit = 50): Promise<GameLeaderboardRow[]> {
  if (!ready()) return [];
  try {
    const { data, error } = await supabase!
      .from('game_leaderboard')
      .select('*')
      .eq('game_id', gameId)
      .order('rank', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as GameLeaderboardRow[];
  } catch (err) {
    warn('fetchGameLeaderboard', err);
    return [];
  }
}

export { isCloudEnabled };
