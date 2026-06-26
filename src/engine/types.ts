import type { ComponentType } from 'react';

/** How a game is contested when two players are involved. */
export type Contest =
  | 'race' // both solve the same seeded puzzle simultaneously (split screen); first done wins
  | 'score' // alternating rounds on the same seed; highest score wins
  | 'table'; // a single shared board the game manages internally (e.g. card games)

/** Who is playing — chosen by the user on the GamePage. */
export type PlayMode =
  | 'solo' // one human
  | 'duo' // two humans, same device
  | 'bot'; // one human vs one bot

export type Seat = number;
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Category = 'puzzle' | 'card' | 'word' | 'arcade' | 'board' | 'sort';

export interface PlayerInfo {
  seat: Seat;
  name: string;
  kind: 'human' | 'bot';
  color: string;
  difficulty: Difficulty;
}

export interface SoloResult {
  /** Higher is better. For race games this can be derived from time. */
  score: number;
  /** Did the player fully solve / win the puzzle (vs run out / give up). */
  solved: boolean;
  timeMs: number;
}

/**
 * A "solo" game plays ONE puzzle for ONE seat. The engine mounts it once (solo
 * play), twice side-by-side (race), or sequentially (score). The component is
 * responsible for driving its own bot when `isBot` is true.
 */
export interface SoloGameProps {
  seed: number;
  player: PlayerInfo;
  isBot: boolean;
  difficulty: Difficulty;
  paused: boolean;
  /** Optional 0..100 completion signal used for race progress bars. */
  onProgress?: (pct: number) => void;
  /** Optional live score signal (score / endless games). */
  onScore?: (score: number) => void;
  /** Called once when this seat finishes (solved or game over). */
  onDone: (result: SoloResult) => void;
}

/**
 * A "table" game manages the whole multiplayer board itself (turns, bots, etc).
 * The engine mounts it exactly once and waits for a winner.
 */
export interface TableGameProps {
  players: PlayerInfo[];
  onGameOver: (winnerSeat: Seat) => void;
}

export interface GameModule {
  contest: Contest;
  Solo?: ComponentType<SoloGameProps>;
  Table?: ComponentType<TableGameProps>;
}

export interface GameDefinition {
  id: string;
  title: string;
  category: Category;
  contest: Contest;
  /** Short marketing-style description shown on the game page. */
  blurb: string;
  /** Tile art (decorative SVG). */
  icon: ComponentType;
  /** Base tile gradient colors. */
  accent: string;
  accent2: string;
  /** Lazy module loader — keeps the initial bundle small across 100+ games. */
  load: () => Promise<GameModule>;
  /** Marks high-visibility games for the Home "Featured" row. */
  featured?: boolean;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  puzzle: 'Puzzle',
  card: 'Cards',
  word: 'Word',
  arcade: 'Arcade',
  board: 'Board',
  sort: 'Sort'
};
