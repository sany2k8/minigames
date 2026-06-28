/**
 * Cloud sync service — a thin, offline-safe layer over Supabase.
 *
 * Design rules (this app is offline-first):
 *  - Every function is a no-op when the cloud is disabled or the device is
 *    offline. Nothing here ever throws into the UI; failures are swallowed and
 *    logged in dev only. Local state (the zustand store) stays the source of
 *    truth — the cloud is best-effort mirroring on top.
 *  - Auth is anonymous: each device/browser becomes one anonymous player. We
 *    sign in lazily on the first successful sync.
 */
import { supabase, isCloudEnabled } from './supabase';
import type { Difficulty } from '../engine/types';
import type { Outcome } from '../store/store';
import type { GlobalLeaderboardRow, GameLeaderboardRow } from './database.types';

const online = () => typeof navigator === 'undefined' || navigator.onLine;
const active = (): boolean => isCloudEnabled && supabase !== null && online();

function warn(scope: string, err: unknown) {
  if (import.meta.env.DEV) console.warn(`[cloud] ${scope} failed:`, err);
}

let sessionPromise: Promise<string | null> | null = null;

/** Ensure an (anonymous) session exists; returns the user id, or null. */
export async function ensureSession(): Promise<string | null> {
  if (!active()) return null;
  if (sessionPromise) return sessionPromise;

  sessionPromise = (async () => {
    try {
      const { data } = await supabase!.auth.getSession();
      if (data.session?.user) return data.session.user.id;

      const { data: signed, error } = await supabase!.auth.signInAnonymously();
      if (error) throw error;
      return signed.user?.id ?? null;
    } catch (err) {
      warn('ensureSession', err);
      sessionPromise = null; // allow a later retry
      return null;
    }
  })();

  return sessionPromise;
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
  if (!active()) return;
  const uid = await ensureSession();
  if (!uid) return;

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

/** Push the aggregate profile snapshot (debounced by the caller). */
export async function syncProfile(s: ProfileSnapshot): Promise<void> {
  if (!active()) return;
  const uid = await ensureSession();
  if (!uid) return;

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

/** Top players by points. Returns [] when offline/disabled. */
export async function fetchGlobalLeaderboard(limit = 50): Promise<GlobalLeaderboardRow[]> {
  if (!active()) return [];
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

/** Top scores for one game. Returns [] when offline/disabled. */
export async function fetchGameLeaderboard(gameId: string, limit = 50): Promise<GameLeaderboardRow[]> {
  if (!active()) return [];
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
