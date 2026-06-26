import type { Contest, Difficulty, PlayerInfo, PlayMode } from './types';

const BOT_NAMES = ['Maya', 'Grace', 'Leo', 'Max'];

/**
 * Builds the seated player list for a match from the chosen play mode.
 * - race/score: 1 seat (solo) or 2 seats (duo = two humans, bot = human + bot)
 * - table: a full table — solo/bot = 1 human + 3 bots, duo = 2 humans + 2 bots
 */
export function buildPlayers(
  contest: Contest,
  mode: PlayMode,
  difficulty: Difficulty,
  p1Name: string,
  p2Name: string
): PlayerInfo[] {
  const human = (seat: number, name: string, color: string): PlayerInfo => ({
    seat,
    name,
    kind: 'human',
    color,
    difficulty
  });
  const bot = (seat: number, name: string, color: string): PlayerInfo => ({
    seat,
    name,
    kind: 'bot',
    color,
    difficulty
  });
  const colors = ['var(--p1)', 'var(--p2)', '#ffd166', '#51e08a'];

  if (contest === 'table') {
    if (mode === 'duo') {
      return [
        human(0, p1Name, colors[0]),
        human(1, p2Name, colors[1]),
        bot(2, BOT_NAMES[0], colors[2]),
        bot(3, BOT_NAMES[1], colors[3])
      ];
    }
    // solo or bot: you + 3 bots
    return [
      human(0, p1Name, colors[0]),
      bot(1, BOT_NAMES[0], colors[1]),
      bot(2, BOT_NAMES[1], colors[2]),
      bot(3, BOT_NAMES[2], colors[3])
    ];
  }

  // race / score
  if (mode === 'solo') return [human(0, p1Name, colors[0])];
  if (mode === 'bot') return [human(0, p1Name, colors[0]), bot(1, BOT_NAMES[3], colors[1])];
  return [human(0, p1Name, colors[0]), human(1, p2Name, colors[1])];
}
