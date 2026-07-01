import { useMemo } from 'react';
import { getGame } from '../games/registry';
import { useApp, emptyStats, winPct, type GameStats } from '../store/store';
import { dayKey } from '../lib/daily';

const WEEKS = 14; // ~3 months of activity

/** Activity heatmap + per-game win-rate breakdown for the Profile page. */
export function StatsDashboard() {
  const activity = useApp((s) => s.activity);
  const stats = useApp((s) => s.stats);

  // Build a WEEKS×7 grid ending today, aligned so the last column is this week.
  const { columns, max } = useMemo(() => {
    const today = new Date();
    const days: { key: string; count: number }[] = [];
    const total = WEEKS * 7;
    // Walk back so the grid ends on today; pad the final partial week ahead.
    const endPad = 6 - ((today.getDay() + 6) % 7); // days remaining in current Mon-Sun week
    const start = new Date(today);
    start.setDate(start.getDate() - (total - 1 - endPad));
    let mx = 1;
    for (let i = 0; i < total; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = dayKey(d);
      const count = activity[key] ?? 0;
      if (count > mx) mx = count;
      days.push({ key, count });
    }
    const cols: { key: string; count: number }[][] = [];
    for (let i = 0; i < days.length; i += 7) cols.push(days.slice(i, i + 7));
    return { columns: cols, max: mx };
  }, [activity]);

  const topGames = useMemo(() => {
    return Object.keys(stats)
      .map((id) => ({ id, st: stats[id] ?? emptyStats(), game: getGame(id) }))
      .filter((x) => x.game && x.st.wins + x.st.draws + x.st.losses > 0)
      .sort((a, b) => total(b.st) - total(a.st))
      .slice(0, 6);
  }, [stats]);

  const level = (c: number) => {
    if (c === 0) return 'rgba(0,0,0,0.06)';
    const t = Math.min(1, c / max);
    return `color-mix(in srgb, var(--color-coral) ${20 + Math.round(t * 80)}%, transparent)`;
  };

  return (
    <div className="space-y-8">
      <div className="card p-5">
        <h3 className="text-base font-bold mb-4">Activity</h3>
        <div className="flex gap-[3px] overflow-x-auto pb-1">
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-[3px]">
              {col.map((cell) => (
                <div
                  key={cell.key}
                  title={`${cell.key}: ${cell.count} ${cell.count === 1 ? 'play' : 'plays'}`}
                  className="w-3 h-3 rounded-[3px]"
                  style={{ background: level(cell.count) }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-1.5 mt-3 text-[11px] text-ink-faint">
          Less
          {[0, 0.25, 0.5, 1].map((t, i) => (
            <span key={i} className="w-3 h-3 rounded-[3px]" style={{ background: t === 0 ? 'rgba(0,0,0,0.06)' : `color-mix(in srgb, var(--color-coral) ${20 + t * 80}%, transparent)` }} />
          ))}
          More
        </div>
      </div>

      {topGames.length > 0 && (
        <div className="card p-5">
          <h3 className="text-base font-bold mb-4">Win rate by game</h3>
          <div className="space-y-3.5">
            {topGames.map(({ id, st, game }) => {
              const pct = winPct(st);
              return (
                <div key={id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-bold truncate">{game!.title}</span>
                    <span className="text-ink-faint font-bold shrink-0 ml-2">
                      {pct}% · {st.wins}W {st.losses}L
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-line overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,var(--color-coral),var(--color-coral-2))' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const total = (st: GameStats) => st.wins + st.draws + st.losses;
